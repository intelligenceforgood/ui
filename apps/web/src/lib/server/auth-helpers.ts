import { headers as nextHeaders } from "next/headers";
import { getIapToken } from "@/lib/iap-token";

/**
 * Decode the payload of a JWT **without** verifying the signature.
 *
 * We only need to read the `email` claim from the IAP assertion that
 * Google has already verified at the load-balancer level.
 */
function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Build auth headers for outgoing API requests.
 *
 * 1. Extract the browser user's email from the incoming IAP assertion
 *    and forward it in `X-I4G-Forwarded-User`.  The API trusts this
 *    header when it arrives alongside a valid service credential
 *    (Bearer token or API key).
 * 2. Add a service-to-service Bearer token when running on Cloud Run
 *    (skipped for local/localhost targets).
 */
export async function getIapHeaders(): Promise<Record<string, string>> {
  const outHeaders: Record<string, string> = {};

  // ── 1. Extract user email from incoming IAP assertion ──────────
  // IAP injects `X-Goog-IAP-JWT-Assertion` at the LB with the
  // authenticated browser user's identity.  We cannot forward the raw
  // assertion because the API sits behind its own IAP backend which
  // would strip/replace it.  Instead, extract the email and send it
  // as a trusted custom header.
  try {
    const incoming = await nextHeaders();
    const iapAssertion = incoming.get("x-goog-iap-jwt-assertion");
    if (iapAssertion) {
      const payload = decodeJwtPayload(iapAssertion);
      const email = payload?.email;
      if (typeof email === "string" && email) {
        outHeaders["X-I4G-Forwarded-User"] = email;
      }
    }
  } catch {
    // headers() throws outside a request context (e.g. during build).
  }

  // ── 2. Skip service-to-service token for local targets ─────────
  const isLocalEnv = process.env.I4G_ENV === "local";
  const apiUrl =
    process.env.I4G_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  const isLocalhost =
    apiUrl && (apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1"));

  if (isLocalEnv || isLocalhost) {
    return outHeaders;
  }

  // ── 3. Bearer token for Cloud Run → Cloud Run auth ─────────────
  const audience = process.env.I4G_IAP_CLIENT_ID || apiUrl;

  if (audience) {
    const token = await getIapToken(audience);
    if (token) {
      outHeaders["Authorization"] = `Bearer ${token}`;
    }
  }
  return outHeaders;
}

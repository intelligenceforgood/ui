/**
 * SSI service proxy helper — used by **eCX routes only**.
 *
 * Investigation lifecycle routes (trigger + poll) go through Core API,
 * NOT through this helper. See `api/ssi/investigate/route.ts`.
 *
 * Resolves the upstream SSI API URL from `SSI_API_URL` env var and
 * injects a Cloud Run identity token when running on GCP so the
 * console can reach the authenticated ssi-svc.
 */

import { getIapToken } from "@/lib/iap-token";

/**
 * Resolve SSI base URL from `SSI_API_URL` env var.
 *
 * Throws if the variable is unset or empty — eCX routes cannot
 * function without a reachable SSI service.
 */
export function resolveSsiUrl(): string {
  const url = process.env.SSI_API_URL;
  if (!url) {
    throw new Error(
      "SSI_API_URL is not set. eCX proxy routes require " +
        "a reachable SSI service URL (e.g. http://localhost:8100).",
    );
  }
  return url;
}

/** True when SSI is a remote (non-localhost) target requiring auth. */
function needsAuth(url: string): boolean {
  return (
    !!process.env.K_SERVICE &&
    !url.includes("localhost") &&
    !url.includes("127.0.0.1")
  );
}

/**
 * Build headers for outgoing SSI requests.
 *
 * On Cloud Run, fetches an identity token with the SSI service URL as
 * audience so the request passes Cloud Run IAM checks.
 */
export async function ssiHeaders(): Promise<Record<string, string>> {
  const base = resolveSsiUrl();
  if (!needsAuth(base)) return {};

  const token = await getIapToken(base);
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

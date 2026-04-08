import { createClient, type I4GClient } from "@i4g/sdk";
import { createPlatformClient } from "@/lib/platform-client";
import { ENGAGEMENT_COOKIE_NAME } from "@/lib/engagement-cookie";

let cachedClient: I4GClient | null = null;

function resolveBaseUrl(): string {
  const baseUrl =
    (typeof window === "undefined" ? process.env.I4G_API_URL : "/api") ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "";

  if (!baseUrl) {
    throw new Error(
      "I4G_API_URL or NEXT_PUBLIC_API_BASE_URL must be set. " +
        "Mock data is no longer available at runtime.",
    );
  }
  return baseUrl;
}

function buildClient(additionalHeaders?: Record<string, string>): I4GClient {
  const baseUrl = resolveBaseUrl();
  const useCoreApi = process.env.I4G_API_KIND === "core";

  return useCoreApi
    ? createPlatformClient({
        baseUrl,
        apiKey: process.env.I4G_API_KEY,
        iapClientId: process.env.I4G_IAP_CLIENT_ID,
        additionalHeaders,
      })
    : createClient({
        baseUrl,
        apiKey: process.env.I4G_API_KEY,
        additionalHeaders,
      });
}

/**
 * Return an I4GClient configured for the current request context.
 *
 * **Server-side:** reads the engagement cookie via `next/headers` and
 * injects `X-Engagement-Id` so every backend call is engagement-scoped.
 * A fresh client is returned per request (headers change per request).
 *
 * **Client-side:** returns a cached client.  The Next.js API proxy
 * injects the engagement header automatically.
 */
export async function getI4GClient(): Promise<I4GClient> {
  // Client-side: the proxy injects the header, so a cached client is fine.
  if (typeof window !== "undefined") {
    if (!cachedClient) {
      cachedClient = buildClient();
    }
    return cachedClient;
  }

  // Server-side: read the engagement cookie from the incoming request.
  const headers: Record<string, string> = {};
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const engagementId = store.get(ENGAGEMENT_COOKIE_NAME)?.value;
    if (engagementId) {
      headers["X-Engagement-Id"] = engagementId;
    }
  } catch {
    // Outside of a request context (e.g. build time) — no cookie available.
  }

  return buildClient(Object.keys(headers).length ? headers : undefined);
}

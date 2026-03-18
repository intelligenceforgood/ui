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

const DEFAULT_SSI_URL = "http://localhost:8100";

/** Resolve SSI base URL, treating empty string as unset. */
export function resolveSsiUrl(): string {
  return process.env.SSI_API_URL || DEFAULT_SSI_URL;
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

import { getIapToken } from "@/lib/iap-token";

export async function getIapHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  // 1. Check for explicit local environment or localhost target
  // If I4G_ENV is local, we assume we are targeting a local backend which doesn't require IAP.
  // If the API URL is localhost, we also skip IAP.
  const isLocalEnv = process.env.I4G_ENV === "local";
  const apiUrl =
    process.env.I4G_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  const isLocalhost =
    apiUrl && (apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1"));

  if (isLocalEnv || isLocalhost) {
    return headers;
  }

  // Use IAP Client ID if available, otherwise fall back to the API URL (for direct Cloud Run invocation)
  const audience = process.env.I4G_IAP_CLIENT_ID || apiUrl;

  if (audience) {
    const token = await getIapToken(audience);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

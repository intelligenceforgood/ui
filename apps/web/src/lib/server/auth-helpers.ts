import { getIapToken } from "@/lib/iap-token";

export async function getIapHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  // Use IAP Client ID if available, otherwise fall back to the API URL (for direct Cloud Run invocation)
  const audience =
    process.env.I4G_IAP_CLIENT_ID ||
    process.env.I4G_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (audience) {
    const token = await getIapToken(audience);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

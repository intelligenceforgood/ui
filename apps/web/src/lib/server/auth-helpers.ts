import { GoogleAuth } from "google-auth-library";

export async function getIapHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  // Use IAP Client ID if available, otherwise fall back to the API URL (for direct Cloud Run invocation)
  const audience =
    process.env.I4G_IAP_CLIENT_ID ||
    process.env.I4G_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (audience) {
    try {
      const auth = new GoogleAuth();
      const client = await auth.getIdTokenClient(audience);
      // Pass audience explicitly to getRequestHeaders to ensure the token is generated
      const iapHeaders = await client.getRequestHeaders(audience);
      Object.assign(headers, iapHeaders);
    } catch (err) {
      console.warn("Failed to generate auth token", err);
    }
  }
  return headers;
}

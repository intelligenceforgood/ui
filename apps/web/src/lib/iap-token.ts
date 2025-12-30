import { GoogleAuth } from "google-auth-library";

export async function getIapToken(iapClientId: string): Promise<string | null> {
  try {
    let token: string | null = null;

    // 1. Try Metadata Server (Cloud Run) - FORCE email claim
    // We check for K_SERVICE to ensure we are in a Cloud Run environment
    if (process.env.K_SERVICE) {
      try {
        const metadataUrl = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${iapClientId}&format=full`;
        const response = await fetch(metadataUrl, {
          headers: { "Metadata-Flavor": "Google" },
        });
        if (response.ok) {
          token = await response.text();
        }
      } catch {
        // Metadata server not available
      }
    }

    // 2. Fallback to GoogleAuth (Local / Other)
    if (!token) {
      const auth = new GoogleAuth();
      const client = await auth.getIdTokenClient(iapClientId);
      const iapHeaders = await client.getRequestHeaders(iapClientId);
      // Cast to Record<string, string> to safely access properties
      const headersMap = iapHeaders as unknown as Record<string, string>;
      const authHeader =
        headersMap["Authorization"] || headersMap["authorization"];
      if (authHeader) {
        token = authHeader.split(" ")[1];
      }
    }
    return token;
  } catch (err) {
    console.warn("Failed to generate IAP token", err);
    return null;
  }
}

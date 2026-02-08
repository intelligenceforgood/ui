import { createClient, type I4GClient } from "@i4g/sdk";
import { createPlatformClient } from "@/lib/platform-client";

let cachedClient: I4GClient | null = null;

function resolveClient(): I4GClient {
  if (cachedClient) {
    return cachedClient;
  }

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

  const useCoreApi = process.env.I4G_API_KIND === "core";

  cachedClient = useCoreApi
    ? createPlatformClient({
        baseUrl,
        apiKey: process.env.I4G_API_KEY,
        iapClientId: process.env.I4G_IAP_CLIENT_ID,
      })
    : createClient({
        baseUrl,
        apiKey: process.env.I4G_API_KEY,
      });

  return cachedClient;
}

export function getI4GClient() {
  return resolveClient();
}

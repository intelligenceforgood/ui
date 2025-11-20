import { createClient, createMockClient, type I4GClient } from "@i4g/sdk";
import { createProtoBackedClient } from "@/lib/proto-client";

let cachedClient: I4GClient | null = null;

function resolveClient(): I4GClient {
  if (cachedClient) {
    return cachedClient;
  }

  const useMock =
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" ||
    (!process.env.I4G_API_URL && !process.env.NEXT_PUBLIC_API_BASE_URL);

  if (useMock) {
    cachedClient = createMockClient();
    return cachedClient;
  }

  const baseUrl =
    process.env.I4G_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

  if (!baseUrl) {
    cachedClient = createMockClient();
    return cachedClient;
  }

  if (process.env.I4G_API_KIND === "proto") {
    cachedClient = createProtoBackedClient({
      baseUrl,
      apiKey: process.env.I4G_API_KEY,
    });
    return cachedClient;
  }

  cachedClient = createClient({
    baseUrl,
    apiKey: process.env.I4G_API_KEY,
  });

  return cachedClient;
}

export function getI4GClient() {
  return resolveClient();
}

"use server";

import { getIapHeaders } from "./auth-helpers";

function resolveApiBase() {
  return (
    process.env.I4G_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? null
  );
}

function resolveApiKey() {
  return process.env.I4G_API_KEY ?? process.env.NEXT_PUBLIC_API_KEY ?? null;
}

export async function getTaxonomyTree() {
  const baseUrl = resolveApiBase();
  if (!baseUrl) {
    throw new Error("API URL not configured");
  }

  const url = new URL("/taxonomy", baseUrl);
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const iapHeaders = await getIapHeaders();
  Object.assign(headers, iapHeaders);

  const apiKey = resolveApiKey();
  if (apiKey) {
    headers["X-API-KEY"] = apiKey;
  }

  const response = await fetch(url, { headers, cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Taxonomy request failed: ${response.status}`);
  }

  return response.json();
}

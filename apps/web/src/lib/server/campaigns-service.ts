"use server";

import type {
  Campaign,
  CreateCampaignPayload,
  UpdateCampaignPayload,
} from "@/types/campaigns";
import { getIapHeaders } from "./auth-helpers";

function resolveApiBase() {
  return (
    process.env.I4G_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? null
  );
}

function resolveApiKey() {
  return process.env.I4G_API_KEY ?? process.env.NEXT_PUBLIC_API_KEY ?? null;
}

async function fetchJson(
  path: string,
  options: RequestInit = {},
  queryParams?: Record<string, string>,
) {
  const baseUrl = resolveApiBase();
  if (!baseUrl) {
    throw new Error("API URL not configured");
  }

  const url = new URL(path, baseUrl);
  Object.entries(queryParams ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  });

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const iapHeaders = await getIapHeaders();
  Object.assign(headers, iapHeaders);

  const apiKey = resolveApiKey();
  if (apiKey) {
    headers["X-API-KEY"] = apiKey;
  }

  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Campaign service request failed with status ${response.status}: ${body}`,
    );
  }

  return response.json();
}

export async function listCampaigns(): Promise<Campaign[]> {
  const data = await fetchJson("/campaigns");
  return data as Campaign[];
}

export async function createCampaign(
  payload: CreateCampaignPayload,
): Promise<string> {
  const data = await fetchJson("/campaigns", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data as string;
}

export async function updateCampaign(
  id: string,
  payload: UpdateCampaignPayload,
): Promise<void> {
  await fetchJson(`/campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

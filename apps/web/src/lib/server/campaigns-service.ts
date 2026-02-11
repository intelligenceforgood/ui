"use server";

import type {
  Campaign,
  CreateCampaignPayload,
  UpdateCampaignPayload,
} from "@/types/campaigns";
import { apiFetch } from "./api-client";

export async function listCampaigns(): Promise<Campaign[]> {
  return apiFetch<Campaign[]>("/campaigns");
}

export async function createCampaign(
  payload: CreateCampaignPayload,
): Promise<string> {
  return apiFetch<string>("/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateCampaign(
  id: string,
  payload: UpdateCampaignPayload,
): Promise<void> {
  await apiFetch(`/campaigns/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

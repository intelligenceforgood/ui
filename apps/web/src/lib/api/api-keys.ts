"use server";

import { apiFetch } from "@/lib/server/api-client";

export interface CreateApiKeyRequest {
  description: string;
  scopes?: string[] | null;
  expiresInDays?: number | null;
}

export interface CreatePartnerKeyRequest {
  partnerName: string;
  ownerEmail?: string | null;
  scopes?: string[] | null;
  expiresInDays?: number | null;
  rateLimitPerMinute?: number | null;
  description?: string | null;
}

export interface CreateApiKeyResponse {
  rawKey: string;
  keyId: string;
  keyPrefix: string;
  expiresAt: string | null;
}

export interface ApiKeyInfo {
  keyId: string;
  keyPrefix: string;
  description: string | null;
  ownerEmail: string | null;
  keyType: string;
  partnerName: string | null;
  scopes: string[];
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface ApiKeyListResponse {
  keys: ApiKeyInfo[];
}

/**
 * Create a new self-service API key for the current user.
 */
export async function createApiKey(
  req: CreateApiKeyRequest,
): Promise<CreateApiKeyResponse> {
  return apiFetch<CreateApiKeyResponse>("/api-keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: req.description,
      scopes: req.scopes ?? undefined,
      expires_in_days: req.expiresInDays ?? undefined,
    }),
  });
}

/**
 * List all API keys owned by the current user.
 */
export async function listApiKeys(): Promise<ApiKeyListResponse> {
  return apiFetch<ApiKeyListResponse>("/api-keys");
}

/**
 * Revoke an API key owned by the current user.
 */
export async function revokeApiKey(keyId: string): Promise<void> {
  await apiFetch<void>(`/api-keys/${encodeURIComponent(keyId)}`, {
    method: "DELETE",
  });
}

/**
 * Admin: List all API keys across all users.
 */
export async function adminListApiKeys(
  keyType?: string,
  activeOnly = false,
): Promise<ApiKeyListResponse> {
  const queryParams: Record<string, string> = {};
  if (keyType) queryParams.key_type = keyType;
  if (activeOnly) queryParams.active_only = "true";

  return apiFetch<ApiKeyListResponse>("/admin/api-keys", { queryParams });
}

/**
 * Admin: Revoke any API key.
 */
export async function adminRevokeApiKey(keyId: string): Promise<void> {
  await apiFetch<void>(`/admin/api-keys/${encodeURIComponent(keyId)}`, {
    method: "DELETE",
  });
}

/**
 * Admin: Provision a new partner-type API key.
 */
export async function createPartnerKey(
  req: CreatePartnerKeyRequest,
): Promise<CreateApiKeyResponse> {
  return apiFetch<CreateApiKeyResponse>("/admin/api-keys/partner", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      partner_name: req.partnerName,
      owner_email: req.ownerEmail ?? undefined,
      scopes: req.scopes ?? undefined,
      expires_in_days: req.expiresInDays ?? undefined,
      rate_limit_per_minute: req.rateLimitPerMinute ?? undefined,
      description: req.description ?? undefined,
    }),
  });
}

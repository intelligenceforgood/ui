"use server";

import { apiFetch } from "@/lib/server/api-client";

export interface AccountInfo {
  email: string;
  role: string;
  displayName: string | null;
  isActive: boolean;
}

interface AccountListResponse {
  items: AccountInfo[];
  count: number;
}

/**
 * Fetch all user accounts (admin-only).
 *
 * @param activeOnly When true, only active accounts are returned.
 */
export async function listAccounts(activeOnly = true): Promise<AccountInfo[]> {
  const data = await apiFetch<AccountListResponse>("/accounts", {
    queryParams: { active_only: String(activeOnly) },
  });
  return data.items;
}

export interface RoleUpdateResult {
  email: string;
  oldRole: string;
  newRole: string;
  updated: boolean;
}

/**
 * Change a user's role (admin-only).
 */
export async function updateUserRole(
  email: string,
  role: string,
): Promise<RoleUpdateResult> {
  return apiFetch<RoleUpdateResult>(
    `/accounts/${encodeURIComponent(email)}/role`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  );
}

/**
 * Deactivate a user account (admin-only).
 */
export async function deactivateAccount(
  email: string,
): Promise<{ email: string; deactivated: boolean }> {
  return apiFetch(`/accounts/${encodeURIComponent(email)}/deactivate`, {
    method: "PUT",
  });
}

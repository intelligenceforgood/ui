"use server";

import { apiFetch } from "@/lib/server/api-client";

export interface CurrentUser {
  email: string;
  role: string;
  displayName: string | null;
  isActive: boolean;
}

/**
 * Fetch the current user's account info (including role) from the backend.
 *
 * Called server-side to populate the auth context. The backend resolves
 * identity from the IAP JWT / API key and looks up the role in the
 * accounts table.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await apiFetch<CurrentUser>("/accounts/me");
  } catch {
    return null;
  }
}

"use server";

import { getI4GClient } from "@/lib/i4g-client";

export async function detokenizeAction(token: string, caseId?: string) {
  const client = getI4GClient();
  const response = await client.detokenize(token, caseId);
  return response.canonical_value;
}

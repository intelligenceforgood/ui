"use server";

import type { TaxonomyResponse } from "@i4g/sdk";
import { apiFetch } from "./api-client";

export async function getTaxonomyTree() {
  return apiFetch<TaxonomyResponse>("/taxonomy");
}

"use server";

import { z } from "zod";
import { apiFetch } from "./api-client";

const apiRunSchema = z.object({
  requestId: z.string(),
  actor: z.string().default("accounts_api"),
  source: z.string().default("api"),
  generatedAt: z.string(),
  indicatorCount: z.number().int().nonnegative().default(0),
  sourceCount: z.number().int().nonnegative().default(0),
  warnings: z.array(z.string()).default([]),
  artifacts: z.record(z.string()).default({}),
  categories: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
});

const apiRunsResponseSchema = z.object({
  runs: z.array(apiRunSchema),
  count: z.number().int().nonnegative(),
});

const indicatorSchema = z.object({
  category: z.string(),
  item: z.string(),
  type: z.string(),
  number: z.string(),
  source_case_id: z.string().nullable().optional(),
  metadata: z.record(z.any()).optional(),
});

const sourceSchema = z.object({
  case_id: z.string(),
  content: z.string().optional(),
  dataset: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  classification: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  score: z.number().optional(),
  excerpt: z.string().nullable().optional(),
});

const accountListResultSchema = z.object({
  request_id: z.string(),
  generated_at: z.string(),
  indicators: z.array(indicatorSchema),
  sources: z.array(sourceSchema),
  warnings: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  artifacts: z.record(z.string()).default({}),
});

export type AccountListRun = z.infer<typeof apiRunSchema>;
export type AccountListResult = z.infer<typeof accountListResultSchema>;

function sanitizeLimit(limit: number | undefined, fallback = 10) {
  if (!limit || Number.isNaN(limit)) {
    return fallback;
  }
  return Math.min(Math.max(limit, 1), 50);
}

export async function getAccountListRuns(
  limit?: number,
): Promise<AccountListRun[]> {
  const payload = await apiFetch<unknown>("/accounts/runs", {
    queryParams: { limit: String(sanitizeLimit(limit)) },
  });
  const parsed = apiRunsResponseSchema.parse(payload);
  return parsed.runs;
}

export type AccountListRunRequest = {
  startTime?: string | null;
  endTime?: string | null;
  categories?: string[];
  topK?: number;
  includeSources?: boolean;
  outputFormats?: string[];
};

function buildRunPayload(input: AccountListRunRequest) {
  const payload: Record<string, unknown> = {};
  if (input.startTime) {
    payload.start_time = input.startTime;
  }
  if (input.endTime) {
    payload.end_time = input.endTime;
  }
  if (input.categories?.length) {
    payload.categories = input.categories;
  }
  if (typeof input.topK === "number") {
    payload.top_k = input.topK;
  }
  if (typeof input.includeSources === "boolean") {
    payload.include_sources = input.includeSources;
  }
  if (input.outputFormats?.length) {
    payload.output_formats = input.outputFormats;
  }
  return payload;
}

export async function triggerAccountListRun(
  input: AccountListRunRequest,
): Promise<AccountListResult> {
  const payload = buildRunPayload(input);
  const data = await apiFetch<unknown>("/accounts/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return accountListResultSchema.parse(data);
}

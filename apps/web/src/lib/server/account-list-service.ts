"use server";

import { z } from "zod";

const apiRunSchema = z.object({
  request_id: z.string(),
  actor: z.string().default("accounts_api"),
  source: z.string().default("api"),
  generated_at: z.string(),
  indicator_count: z.number().int().nonnegative().default(0),
  source_count: z.number().int().nonnegative().default(0),
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

const MOCK_RUNS: AccountListRun[] = [
  {
    request_id: "account-run-mock-1",
    actor: "accounts_api:mock",
    source: "api",
    generated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    indicator_count: 4,
    source_count: 3,
    warnings: ["Mock data only"],
    artifacts: {
      pdf: "https://example.org/mock-account-list.pdf",
      xlsx: "https://example.org/mock-account-list.xlsx",
    },
    categories: ["bank", "crypto"],
    metadata: { requested_top_k: 25 },
  },
];

const MOCK_RESULT: AccountListResult = {
  request_id: "account-run-mock-1",
  generated_at: new Date().toISOString(),
  indicators: [
    {
      category: "bank",
      item: "Mock Bank",
      type: "account",
      number: "****1111",
      source_case_id: "mock-case-1",
    },
  ],
  sources: [],
  warnings: ["Mock execution"],
  metadata: { requested_top_k: 25 },
  artifacts: {
    pdf: "https://example.org/mock-account-list.pdf",
  },
};

function resolveApiBase() {
  return (
    process.env.I4G_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? null
  );
}

function resolveApiKey() {
  return process.env.I4G_API_KEY ?? process.env.NEXT_PUBLIC_API_KEY ?? null;
}

async function fetchJson(url: URL, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Account list request failed (${response.status}): ${text || "no payload"}`,
    );
  }

  const text = await response.text();
  if (!text) {
    return null;
  }
  return JSON.parse(text) as unknown;
}

function buildUrl(path: string) {
  const base = resolveApiBase();
  if (!base) {
    return null;
  }
  const url = new URL(path, base);
  return url;
}

function sanitizeLimit(limit: number | undefined, fallback = 10) {
  if (!limit || Number.isNaN(limit)) {
    return fallback;
  }
  return Math.min(Math.max(limit, 1), 50);
}

export async function getAccountListRuns(
  limit?: number,
): Promise<AccountListRun[]> {
  const url = buildUrl("/accounts/runs");
  if (!url) {
    return MOCK_RUNS.slice(0, sanitizeLimit(limit));
  }

  url.searchParams.set("limit", String(sanitizeLimit(limit)));

  const apiKey = resolveApiKey();
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const payload = await fetchJson(url, { headers });
    const parsed = apiRunsResponseSchema.parse(payload);
    return parsed.runs;
  } catch (error) {
    console.warn("Falling back to mock account list runs", error);
    return MOCK_RUNS.slice(0, sanitizeLimit(limit));
  }
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
  const url = buildUrl("/accounts/extract");
  if (!url) {
    return MOCK_RESULT;
  }

  const payload = buildRunPayload(input);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const apiKey = resolveApiKey();
  if (apiKey) {
    headers["X-API-KEY"] = apiKey;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Account list run failed (${response.status}): ${text || "no payload"}`,
      );
    }
    const data = (await response.json()) as unknown;
    return accountListResultSchema.parse(data);
  } catch (error) {
    console.error("Falling back to mock account list result", error);
    return { ...MOCK_RESULT, request_id: `account-run-mock-${Date.now()}` };
  }
}

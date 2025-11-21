import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  query: z.string().trim().min(1, "Query is required"),
  pageSize: z.number().int().min(1).max(50).default(10),
  pageToken: z.string().optional(),
  project: z.string().optional(),
  location: z.string().optional(),
  dataStoreId: z.string().optional(),
  servingConfigId: z.string().optional(),
  filterExpression: z.string().optional(),
  boostJson: z.string().optional(),
});

const mockResult = {
  summary: "Mock Discovery Engine result",
  label: "sample",
  tags: ["demo", "vertex"],
  source: "mock",
  index_type: "demo-index",
  struct: { summary: "Mock result", source: "mock" },
  rank_signals: { semanticSimilarityScore: 0.91 },
  raw: { message: "Mock result" },
};

function resolveApiBase() {
  return process.env.I4G_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? null;
}

function resolveApiKey() {
  return process.env.I4G_API_KEY ?? process.env.NEXT_PUBLIC_API_KEY ?? null;
}

type DiscoveryResult = {
  rank: number;
  documentId: string;
  documentName: string;
  summary?: string | null;
  label?: string | null;
  tags: string[];
  source?: string | null;
  indexType?: string | null;
  struct: Record<string, unknown>;
  rankSignals: Record<string, unknown>;
  raw: unknown;
};

type DiscoverySearchResponse = {
  results: DiscoveryResult[];
  totalSize: number;
  nextPageToken?: string;
};

type DocumentPayload = {
  name?: string;
  id?: string;
  struct_data?: Record<string, unknown>;
};

type StructPayload = Record<string, unknown> & {
  summary?: string;
  ground_truth_label?: string;
  source?: string;
  index_type?: string;
};

type RawResult = Record<string, unknown> & {
  document?: DocumentPayload;
  struct?: StructPayload;
  raw?: Record<string, unknown> & { rankSignals?: Record<string, unknown> };
  rank_signals?: Record<string, unknown>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isRawResult(value: unknown): value is RawResult {
  return isPlainObject(value);
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0).slice(0, 12);
  }
  return [];
}

function toRecord(value: unknown): Record<string, unknown> {
  if (isPlainObject(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function mapResult(payload: RawResult, index: number): DiscoveryResult {
  const documentName =
    typeof payload.document_name === "string"
      ? payload.document_name
      : typeof payload.document?.name === "string"
        ? payload.document.name
        : `result-${index + 1}`;

  const documentId =
    typeof payload.document_id === "string"
      ? payload.document_id
      : typeof payload.document?.id === "string"
        ? payload.document.id
        : documentName;

  const tags = toStringArray(payload.tags);
  const summary =
    typeof payload.summary === "string"
      ? payload.summary
      : typeof payload.struct?.summary === "string"
        ? payload.struct.summary
        : null;

  return {
    rank: typeof payload.rank === "number" ? payload.rank : index + 1,
    documentId,
    documentName,
    summary,
    label: typeof payload.label === "string" ? payload.label : payload.struct?.ground_truth_label ?? null,
    tags,
    source:
      typeof payload.source === "string"
        ? payload.source
        : typeof payload.struct?.source === "string"
          ? payload.struct.source
          : null,
    indexType:
      typeof payload.index_type === "string"
        ? payload.index_type
        : typeof payload.struct?.index_type === "string"
          ? payload.struct.index_type
          : null,
    struct: toRecord(payload.struct ?? payload.document?.struct_data ?? {}),
    rankSignals: toRecord(payload.rank_signals ?? payload.raw?.rankSignals ?? {}),
    raw: payload.raw ?? payload,
  } satisfies DiscoveryResult;
}

function buildMockResponse(query: string): DiscoverySearchResponse {
  const template = {
    ...mockResult,
    summary: query ? `Mock hit for "${query}"` : mockResult.summary,
  };
  return {
    results: [0, 1, 2].map((offset) =>
      mapResult(
        {
          ...template,
          rank: offset + 1,
          document_id: `mock-${offset + 1}`,
          document_name: `mock-document-${offset + 1}`,
          tags: ["demo", "vertex", `sample-${offset + 1}`],
          raw: template.raw,
        } as RawResult,
        offset
      )
    ),
    totalSize: 3,
    nextPageToken: undefined,
  } satisfies DiscoverySearchResponse;
}

function buildUrl(baseUrl: string, params: z.infer<typeof requestSchema>) {
  const url = new URL("/discovery/search", baseUrl);
  url.searchParams.set("query", params.query);
  url.searchParams.set("page_size", String(params.pageSize));
  if (params.pageToken) url.searchParams.set("page_token", params.pageToken);
  if (params.project) url.searchParams.set("project", params.project);
  if (params.location) url.searchParams.set("location", params.location);
  if (params.dataStoreId) url.searchParams.set("data_store_id", params.dataStoreId);
  if (params.servingConfigId) url.searchParams.set("serving_config_id", params.servingConfigId);
  if (params.filterExpression) url.searchParams.set("filter", params.filterExpression);
  if (params.boostJson) url.searchParams.set("boost", params.boostJson);
  return url;
}

function mapResponse(payload: unknown): DiscoverySearchResponse {
  if (!payload || typeof payload !== "object") {
    return { results: [], totalSize: 0 };
  }

  const objectPayload = payload as Record<string, unknown>;
  const rawResults: RawResult[] = Array.isArray(objectPayload.results)
    ? objectPayload.results.filter(isRawResult)
    : [];

  const mapped = rawResults.map((item, index) => mapResult(item, index));
  const totalSize = typeof objectPayload.total_size === "number" ? objectPayload.total_size : mapped.length;
  const nextPageToken =
    typeof objectPayload.next_page_token === "string" && objectPayload.next_page_token.length > 0
      ? objectPayload.next_page_token
      : undefined;

  return {
    results: mapped,
    totalSize,
    nextPageToken,
  } satisfies DiscoverySearchResponse;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid Discovery Engine request",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const params = parsed.data;
    const apiBase = resolveApiBase();
    if (!apiBase) {
      return NextResponse.json(buildMockResponse(params.query));
    }

    const url = buildUrl(apiBase, params);
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    const apiKey = resolveApiKey();
    if (apiKey) {
      headers["X-API-KEY"] = apiKey;
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const message = typeof errorPayload.detail === "string" ? errorPayload.detail : "Discovery search failed";
      return NextResponse.json({ error: message, details: errorPayload }, { status: response.status });
    }

    const payload = await response.json();
    return NextResponse.json(mapResponse(payload));
  } catch (error) {
    console.error("Discovery search proxy error", error);
    return NextResponse.json({ error: "Discovery search failed" }, { status: 500 });
  }
}

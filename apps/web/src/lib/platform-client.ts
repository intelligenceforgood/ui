import {
  createClient,
  createMockClient,
  I4GClientError,
  searchRequestSchema,
  type I4GClient,
  type SearchRequest,
  type SearchResponse,
  type SearchResult,
} from "@i4g/sdk";
import { GoogleAuth } from "google-auth-library";

interface PlatformClientConfig {
  baseUrl: string;
  apiKey?: string;
  iapClientId?: string;
}

interface CoreStructuredRecord {
  case_id?: string;
  text?: string;
  metadata?: {
    title?: string;
    tags?: unknown;
    [key: string]: unknown;
  };
  entities?: Record<string, unknown> | null;
  classification?: string;
  confidence?: number;
  created_at?: string;
}

interface CoreVectorRecord {
  label?: string;
  text?: string;
  document?: string;
  similarity?: number;
  score?: number;
  distance?: number;
  classification?: string;
  confidence?: number;
  case_id?: string;
  entities?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

interface CoreSearchEntry {
  case_id?: string;
  score?: number;
  sources?: string[] | string;
  record?: CoreStructuredRecord | null;
  vector?: CoreVectorRecord | null;
  distance?: number;
  metadata?: {
    classification?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function normaliseIsoDate(value: unknown): string {
  if (typeof value === "string" && value) {
    const parsed = Number.isNaN(Date.parse(value)) ? null : new Date(value);
    if (parsed) {
      return parsed.toISOString();
    }
  }
  return new Date().toISOString();
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return fallback;
}

function buildScore(entry: CoreSearchEntry): number {
  const { score, vector } = entry ?? {};
  const candidate =
    [score, vector?.similarity, vector?.score, vector?.distance]
      .map((item) => (typeof item === "number" ? item : Number(item)))
      .find((item) => Number.isFinite(item)) ?? 0;

  if (candidate > 1.0) {
    return Math.min(candidate / 100, 1);
  }

  if (candidate < 0) {
    return Math.max(1 / (1 + Math.abs(candidate)), 0);
  }

  return candidate;
}

function extractTags(entry: CoreSearchEntry): string[] {
  const tags = new Set<string>();
  const record = entry?.record ?? {};
  const vector = entry?.vector ?? {};

  if (typeof record?.classification === "string" && record.classification) {
    tags.add(record.classification);
  }

  const metadataTags = record?.metadata?.tags;
  if (Array.isArray(metadataTags)) {
    metadataTags.forEach((tag) => {
      if (typeof tag === "string" && tag) {
        tags.add(tag);
      }
    });
  }

  const entities = record?.entities;
  if (entities && typeof entities === "object") {
    Object.values(entities).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((entity) => {
          if (typeof entity === "string" && entity) {
            tags.add(entity);
          }
        });
      }
    });
  }

  if (typeof vector?.label === "string" && vector.label) {
    tags.add(vector.label);
  }

  return Array.from(tags).slice(0, 8);
}

function extractSource(entry: CoreSearchEntry): string {
  const sources = entry?.sources;
  if (Array.isArray(sources) && sources.length) {
    const normalized = sources.map((item) => String(item)).filter(Boolean);
    if (normalized.includes("structured") && normalized.includes("vector")) {
      return "hybrid";
    }
    return normalized[0];
  }

  if (typeof sources === "string" && sources) {
    return sources;
  }

  if (entry?.vector) {
    return "vector";
  }

  if (entry?.record) {
    return "structured";
  }

  return "unknown";
}

function extractTitle(entry: CoreSearchEntry): string {
  const record = entry?.record ?? {};
  const vector = entry?.vector ?? {};

  if (typeof record?.metadata?.title === "string" && record.metadata.title) {
    return record.metadata.title;
  }

  if (typeof record?.case_id === "string" && record.case_id) {
    return record.case_id;
  }

  if (typeof record?.text === "string" && record.text) {
    return (
      record.text.split("\n").slice(0, 1).join(" ").slice(0, 120) || "Result"
    );
  }

  if (typeof vector?.text === "string" && vector.text) {
    return (
      vector.text.split("\n").slice(0, 1).join(" ").slice(0, 120) || "Result"
    );
  }

  return "Result";
}

function extractSnippet(entry: CoreSearchEntry): string {
  const record = entry?.record ?? {};
  const vector = entry?.vector ?? {};
  const text =
    (typeof record?.text === "string" && record.text) ||
    (typeof vector?.text === "string" && vector.text) ||
    (typeof vector?.document === "string" && vector.document);

  if (text) {
    return text.slice(0, 280);
  }

  // Fallback for migrated data where text content might be missing in local store
  const classification =
    record?.classification ||
    vector?.classification ||
    entry?.metadata?.classification;

  if (classification) {
    return `[Content unavailable] Classification: ${classification}`;
  }

  return "No excerpt available (migrated data).";
}

function mapCoreSearchResult(
  entry: CoreSearchEntry,
  fallbackIndex: number,
): SearchResult {
  const record = entry?.record ?? {};
  const id =
    (typeof record?.case_id === "string" && record.case_id) ||
    (typeof entry?.case_id === "string" && entry.case_id) ||
    `core-result-${fallbackIndex}`;

  const tags = extractTags(entry);
  const occurredAt = normaliseIsoDate(record?.created_at);
  const confidence =
    typeof record?.confidence === "number" ? record.confidence : undefined;

  return {
    id,
    title: extractTitle(entry),
    snippet: extractSnippet(entry),
    source: extractSource(entry),
    tags,
    score: Number(buildScore(entry).toFixed(2)),
    occurredAt,
    confidence,
  } satisfies SearchResult;
}

function buildFacets(results: SearchResult[]) {
  const sourceCounts = new Map<string, number>();
  const taxonomyCounts = new Map<string, number>();

  results.forEach((result) => {
    sourceCounts.set(result.source, (sourceCounts.get(result.source) ?? 0) + 1);
    result.tags.forEach((tag) => {
      taxonomyCounts.set(tag, (taxonomyCounts.get(tag) ?? 0) + 1);
    });
  });

  const toFacet = (
    field: string,
    label: string,
    counts: Map<string, number>,
  ) => ({
    field,
    label,
    options: Array.from(counts.entries()).map(([value, count]) => ({
      value,
      count,
    })),
  });

  const facets = [] as SearchResponse["facets"];
  if (sourceCounts.size) {
    facets.push(toFacet("source", "Sources", sourceCounts));
  }
  if (taxonomyCounts.size) {
    facets.push(toFacet("taxonomy", "Taxonomy", taxonomyCounts));
  }
  return facets;
}

function buildSuggestions(results: SearchResult[]): string[] {
  const topTags = results.flatMap((result) => result.tags).slice(0, 5);
  const unique = Array.from(new Set(topTags));
  return unique.length
    ? unique
    : results.slice(0, 3).map((result) => result.title);
}

function toIsoOrUndefined(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
}

async function fetchCoreSearch(
  config: PlatformClientConfig,
  request: SearchRequest,
): Promise<SearchResponse> {
  const payload = searchRequestSchema.parse(request);
  const limit = payload.pageSize ?? 10;
  const page = payload.page ?? 1;
  const offset = Math.max(page - 1, 0) * limit;

  const classifications = payload.classifications ?? payload.taxonomy ?? [];
  const datasets = payload.datasets ?? payload.sources ?? [];
  const entities = (payload.entities ?? []).map((entity) => ({
    type: entity.type,
    value: entity.value,
    match_mode: entity.matchMode ?? "exact",
  }));

  const explicitRange = payload.timeRange
    ? {
        start: toIsoOrUndefined(payload.timeRange.start),
        end: toIsoOrUndefined(payload.timeRange.end),
      }
    : undefined;

  const derivedRange =
    !explicitRange && payload.fromDate && payload.toDate
      ? {
          start: toIsoOrUndefined(payload.fromDate),
          end: toIsoOrUndefined(payload.toDate),
        }
      : undefined;

  const timeRange = explicitRange || derivedRange;

  const body: Record<string, unknown> = {
    text: payload.query || undefined,
    classifications: classifications.length ? classifications : undefined,
    datasets: datasets.length ? datasets : undefined,
    entities: entities.length ? entities : undefined,
    limit,
    vector_limit: limit,
    structured_limit: limit,
    offset,
    time_range:
      timeRange && timeRange.start && timeRange.end
        ? { start: timeRange.start, end: timeRange.end }
        : undefined,
  };

  if (payload.savedSearchId) {
    body.saved_search_id = payload.savedSearchId;
  }
  if (payload.savedSearchName) {
    body.saved_search_name = payload.savedSearchName;
  }
  if (payload.savedSearchOwner) {
    body.saved_search_owner = payload.savedSearchOwner;
  }
  if (
    Array.isArray(payload.savedSearchTags) &&
    payload.savedSearchTags.length
  ) {
    body.saved_search_tags = payload.savedSearchTags;
  }

  const url = new URL("/reviews/search/query", config.baseUrl);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (config.apiKey) {
    headers["X-API-KEY"] = config.apiKey;
  }

  if (config.iapClientId) {
    try {
      console.log("Generating IAP token for audience:", config.iapClientId);
      const auth = new GoogleAuth();
      const client = await auth.getIdTokenClient(config.iapClientId);
      const iapHeaders = await client.getRequestHeaders();
      console.log("Generated IAP headers keys:", Object.keys(iapHeaders));
      Object.assign(headers, iapHeaders);
    } catch (err) {
      console.warn("Failed to generate IAP token for core search", err);
    }
  } else {
    console.log("No IAP Client ID configured, skipping token generation");
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorPayload: unknown = null;
    try {
      errorPayload = await response.json();
    } catch (error) {
      errorPayload = { message: "Failed to read error payload", error };
    }

    throw new I4GClientError(
      `Core search failed with status ${response.status}`,
      response.status,
      errorPayload,
    );
  }

  const data = (await response.json()) as unknown;
  const objectPayload =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  const resultsPayload = objectPayload["results"];
  const rawResults = Array.isArray(resultsPayload)
    ? (resultsPayload as CoreSearchEntry[])
    : [];
  const mapped = rawResults.map((entry, index) =>
    mapCoreSearchResult(entry, index),
  );

  const total = toNumber(objectPayload["total"], mapped.length);
  const took = toNumber(
    (objectPayload["elapsed_ms"] as number | string | undefined) ??
      (objectPayload["duration_ms"] as number | string | undefined),
    Math.max(90, mapped.length * 42),
  );

  return {
    results: mapped,
    stats: {
      query: payload.query,
      total,
      took,
      page,
      pageSize: limit,
    },
    facets: buildFacets(mapped),
    suggestions: buildSuggestions(mapped),
  } satisfies SearchResponse;
}

export function createPlatformClient(config: PlatformClientConfig): I4GClient {
  const mock = createMockClient();
  const restClient = createClient({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
  });

  return {
    ...mock,
    ...restClient,
    async searchIntelligence(request) {
      try {
        const response = await fetchCoreSearch(config, request);
        return response;
      } catch (error) {
        console.error(
          "Falling back to mock search due to platform backend error",
          error,
        );
        return mock.searchIntelligence(request);
      }
    },
  } satisfies I4GClient;
}

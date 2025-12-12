"use server";

import { HYBRID_SEARCH_SCHEMA_SNAPSHOT } from "@/config/schema";
import type {
  HybridSearchSchema,
  SavedSearchRecord,
  SearchHistoryEvent,
} from "@/types/reviews";
import {
  isPlainObject,
  mapHistoryEvent,
  mapHybridSearchSchemaPayload,
  mapSavedSearch,
} from "./reviews-service.helpers";

function resolveApiBase() {
  return (
    process.env.I4G_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? null
  );
}

function resolveApiKey() {
  return process.env.I4G_API_KEY ?? process.env.NEXT_PUBLIC_API_KEY ?? null;
}

async function fetchJson(path: string, params?: Record<string, string>) {
  const baseUrl = resolveApiBase();
  if (!baseUrl) {
    return null;
  }

  const url = new URL(path, baseUrl);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  });

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const apiKey = resolveApiKey();
  if (apiKey) {
    headers["X-API-KEY"] = apiKey;
  }

  const response = await fetch(url, { headers, cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Review service request failed with status ${response.status}`,
    );
  }
  return (await response.json()) as unknown;
}

const DEFAULT_SCHEMA: HybridSearchSchema = HYBRID_SEARCH_SCHEMA_SNAPSHOT;

const MOCK_HISTORY: SearchHistoryEvent[] = [
  {
    id: "mock-history-1",
    actor: "analyst_1",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    query: "romance scam remittances",
    classification: "romance_scam",
    resultCount: 8,
    total: 32,
    params: { query: "romance scam remittances", taxonomy: ["romance_scam"] },
  },
  {
    id: "mock-history-2",
    actor: "analyst_2",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    query: "wallet:0x94df intake",
    caseId: "case-102",
    resultCount: 3,
    total: 3,
    params: { text: "wallet:0x94df intake", case_id: "case-102" },
  },
];

const MOCK_SAVED_SEARCHES: SavedSearchRecord[] = [
  {
    id: "saved-mock-1",
    name: "High-risk romance scams",
    owner: "analyst_1",
    favorite: true,
    tags: ["romance", "priority"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    params: {
      query: "romance",
      taxonomy: ["romance_scam"],
      sources: ["intake"],
    },
  },
  {
    id: "saved-mock-2",
    name: "Crypto investment chatter",
    owner: "shared",
    favorite: false,
    tags: ["crypto"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    params: {
      query: "yield guarantee",
      taxonomy: ["crypto_investment"],
      sources: ["open-source"],
    },
  },
];

export async function getSearchHistory(
  limit = 10,
): Promise<SearchHistoryEvent[]> {
  try {
    const payload = await fetchJson("/reviews/search/history", {
      limit: String(limit),
    });
    if (!payload || !isPlainObject(payload)) {
      return MOCK_HISTORY.slice(0, limit);
    }
    const eventsRaw = Array.isArray(payload.events) ? payload.events : [];
    if (!eventsRaw.length) {
      return [];
    }
    return eventsRaw
      .filter((item): item is Record<string, unknown> => isPlainObject(item))
      .map((item) => mapHistoryEvent(item))
      .slice(0, limit);
  } catch (error) {
    console.warn("Falling back to mock search history", error);
    return MOCK_HISTORY.slice(0, limit);
  }
}

export async function getHybridSearchSchema(): Promise<HybridSearchSchema> {
  try {
    const payload = await fetchJson("/reviews/search/schema");
    const mapped =
      payload && isPlainObject(payload)
        ? mapHybridSearchSchemaPayload(payload)
        : DEFAULT_SCHEMA;

    return {
      indicatorTypes: mapped.indicatorTypes.length
        ? mapped.indicatorTypes
        : DEFAULT_SCHEMA.indicatorTypes,
      datasets: mapped.datasets.length
        ? mapped.datasets
        : DEFAULT_SCHEMA.datasets,
      classifications: mapped.classifications.length
        ? mapped.classifications
        : DEFAULT_SCHEMA.classifications,
      lossBuckets: mapped.lossBuckets.length
        ? mapped.lossBuckets
        : DEFAULT_SCHEMA.lossBuckets,
      timePresets: mapped.timePresets.length
        ? mapped.timePresets
        : DEFAULT_SCHEMA.timePresets,
      entityExamples:
        mapped.entityExamples && Object.keys(mapped.entityExamples).length
          ? mapped.entityExamples
          : DEFAULT_SCHEMA.entityExamples,
    } satisfies HybridSearchSchema;
  } catch (error) {
    console.warn("Falling back to default hybrid search schema", error);
    return DEFAULT_SCHEMA;
  }
}

export async function listSavedSearches(options?: {
  limit?: number;
  ownerOnly?: boolean;
}): Promise<SavedSearchRecord[]> {
  const limit = options?.limit ?? 10;
  try {
    const params: Record<string, string> = {
      limit: String(Math.min(limit, 200)),
    };
    if (options?.ownerOnly) {
      params.owner_only = "true";
    }
    const payload = await fetchJson("/reviews/search/saved", params);
    if (!payload || !isPlainObject(payload)) {
      return MOCK_SAVED_SEARCHES.slice(0, limit);
    }
    const items = Array.isArray(payload.items) ? payload.items : [];
    if (!items.length) {
      return [];
    }
    return items
      .filter((item): item is Record<string, unknown> => isPlainObject(item))
      .map((item) => mapSavedSearch(item))
      .slice(0, limit);
  } catch (error) {
    console.warn("Falling back to mock saved searches", error);
    return MOCK_SAVED_SEARCHES.slice(0, limit);
  }
}

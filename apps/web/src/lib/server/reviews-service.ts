"use server";

import { HYBRID_SEARCH_SCHEMA_SNAPSHOT } from "@/config/schema";
import type {
  HybridSearchSchema,
  SavedSearchRecord,
  SearchHistoryEvent,
} from "@/types/reviews";
import { apiFetch } from "./api-client";
import {
  isPlainObject,
  mapHistoryEvent,
  mapHybridSearchSchemaPayload,
  mapSavedSearch,
} from "./reviews-service.helpers";

const DEFAULT_SCHEMA: HybridSearchSchema = HYBRID_SEARCH_SCHEMA_SNAPSHOT;

export async function getSearchHistory(
  limit = 10,
): Promise<SearchHistoryEvent[]> {
  try {
    const payload = await apiFetch<Record<string, unknown>>(
      "/reviews/search/history",
      { queryParams: { limit: String(limit) } },
    );
    if (!payload || !isPlainObject(payload)) {
      return [];
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
    console.warn("Unable to fetch search history", error);
    return [];
  }
}

export async function getHybridSearchSchema(): Promise<HybridSearchSchema> {
  try {
    const payload = await apiFetch<Record<string, unknown>>(
      "/reviews/search/schema",
    );
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
    const payload = await apiFetch<Record<string, unknown>>(
      "/reviews/search/saved",
      { queryParams: params },
    );
    if (!payload || !isPlainObject(payload)) {
      return [];
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
    console.warn("Unable to fetch saved searches", error);
    return [];
  }
}

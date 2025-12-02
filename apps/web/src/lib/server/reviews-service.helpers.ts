import type { HybridSearchSchema, SavedSearchRecord, SearchHistoryEvent } from "@/types/reviews";

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }
  if (typeof value === "string" && value.length > 0) {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

export function mapHistoryEvent(payload: Record<string, unknown>): SearchHistoryEvent {
  const rawPayload = isPlainObject(payload.payload) ? payload.payload : {};
  const createdAt = typeof payload.created_at === "string" ? payload.created_at : new Date().toISOString();
  const actor = typeof payload.actor === "string" && payload.actor.length ? payload.actor : "analyst";

  const fallbackId = `history-${Date.now()}-${Math.round(Math.random() * 1000)}`;
  return {
    id: typeof payload.action_id === "string" ? payload.action_id : fallbackId,
    actor,
    createdAt,
    params: rawPayload,
    query:
      typeof rawPayload.query === "string"
        ? rawPayload.query
        : typeof rawPayload.text === "string"
          ? rawPayload.text
          : undefined,
    classification:
      typeof rawPayload.classification === "string"
        ? rawPayload.classification
        : typeof rawPayload.taxonomy === "string"
          ? rawPayload.taxonomy
          : undefined,
    caseId: typeof rawPayload.case_id === "string" ? rawPayload.case_id : undefined,
    resultCount: typeof rawPayload.results_count === "number" ? rawPayload.results_count : undefined,
    total: typeof rawPayload.total === "number" ? rawPayload.total : undefined,
  } satisfies SearchHistoryEvent;
}

export function mapSavedSearch(payload: Record<string, unknown>): SavedSearchRecord {
  const params = isPlainObject(payload.params) ? payload.params : {};
  const tags = toStringArray(payload.tags);

  const fallbackId = `saved-${Date.now()}-${Math.round(Math.random() * 1000)}`;
  return {
    id: typeof payload.search_id === "string" ? payload.search_id : fallbackId,
    name: typeof payload.name === "string" ? payload.name : "Saved search",
    owner: typeof payload.owner === "string" ? payload.owner : null,
    favorite: Boolean(payload.favorite),
    tags,
    createdAt: typeof payload.created_at === "string" ? payload.created_at : new Date().toISOString(),
    params,
  } satisfies SavedSearchRecord;
}

export function mapEntityExamples(value: unknown): Record<string, string[]> {
  if (!isPlainObject(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, string[]>>((acc, [key, entry]) => {
    if (typeof key !== "string") {
      return acc;
    }
    const examples = toStringArray(entry);
    if (examples.length) {
      acc[key] = examples;
    }
    return acc;
  }, {});
}

export function mapHybridSearchSchemaPayload(value: Record<string, unknown>): HybridSearchSchema {
  return {
    indicatorTypes: toStringArray(value.indicator_types ?? value.indicatorTypes),
    datasets: toStringArray(value.datasets),
    classifications: toStringArray(value.classifications),
    lossBuckets: toStringArray(value.loss_buckets ?? value.lossBuckets),
    timePresets: toStringArray(value.time_presets ?? value.timePresets),
    entityExamples: mapEntityExamples(value.entity_examples ?? value.entityExamples),
  } satisfies HybridSearchSchema;
}

import type { HybridSearchSchema, SavedSearchRecord, SearchHistoryEvent } from "@/types/reviews";

const NESTED_REQUEST_KEYS = ["payload", "params", "body", "request_payload", "requestBody"] as const;

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function mergeUniqueStrings(...sources: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const source of sources) {
    for (const entry of toStringArray(source)) {
      const key = entry.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      result.push(entry);
    }
  }
  return result;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseJsonRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "string") {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function asPlainRecord(value: unknown): Record<string, unknown> | null {
  if (isPlainObject(value)) {
    return value;
  }
  return parseJsonRecord(value);
}

function unwrapSearchParams(candidate: Record<string, unknown>): Record<string, unknown> {
  let current: Record<string, unknown> | null = candidate;
  let iterations = 0;
  while (current && iterations < 5) {
    let next: Record<string, unknown> | null = null;
    for (const key of NESTED_REQUEST_KEYS) {
      next = asPlainRecord(current[key]);
      if (next) {
        break;
      }
    }
    if (!next) {
      break;
    }
    current = next;
    iterations += 1;
  }
  return current ?? candidate;
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

function pickFirstString(
  records: Array<Record<string, unknown> | null | undefined>,
  keys: readonly string[]
): string | undefined {
  for (const record of records) {
    if (!record) {
      continue;
    }
    for (const key of keys) {
      const value = toNonEmptyString(record[key]);
      if (value) {
        return value;
      }
    }
  }
  return undefined;
}

function extractSavedSearchDescriptor(
  rootPayload: Record<string, unknown>,
  requestPayload: Record<string, unknown>
) {
  const sources = [rootPayload, requestPayload];
  const id = pickFirstString(sources, ["saved_search_id", "savedSearchId", "search_id"]);
  const name = pickFirstString(sources, ["saved_search_name", "savedSearchName"]);
  const owner = pickFirstString(sources, ["saved_search_owner", "savedSearchOwner", "owner"]);
  const tags = mergeUniqueStrings(
    ...sources.map((record) => record?.["saved_search_tags"]),
    ...sources.map((record) => record?.["savedSearchTags"])
  );

  if (id || name || owner || tags.length) {
    return {
      id,
      name,
      owner: owner ?? null,
      tags,
    } satisfies SearchHistoryEvent["savedSearch"];
  }

  return null;
}

export function mapHistoryEvent(payload: Record<string, unknown>): SearchHistoryEvent {
  const rawPayload = isPlainObject(payload.payload) ? payload.payload : {};
  const nestedRequest = asPlainRecord(rawPayload.request) ?? rawPayload;
  const requestPayload = unwrapSearchParams(nestedRequest);
  const createdAt = typeof payload.created_at === "string" ? payload.created_at : new Date().toISOString();
  const actor = typeof payload.actor === "string" && payload.actor.length ? payload.actor : "analyst";
  const queryValue = toNonEmptyString(requestPayload.query) ?? toNonEmptyString(requestPayload.text);
  const taxonomyValues = mergeUniqueStrings(
    requestPayload.classification,
    requestPayload.taxonomy,
    requestPayload.classifications
  );
  const classificationValue = taxonomyValues.length ? taxonomyValues[0] : undefined;
  const savedSearch = extractSavedSearchDescriptor(rawPayload, requestPayload);

  const fallbackId = `history-${Date.now()}-${Math.round(Math.random() * 1000)}`;
  return {
    id: typeof payload.action_id === "string" ? payload.action_id : fallbackId,
    actor,
    createdAt,
    params: requestPayload,
    query: queryValue,
    classification: classificationValue,
    caseId: typeof rawPayload.case_id === "string" ? rawPayload.case_id : undefined,
    resultCount: typeof rawPayload.results_count === "number" ? rawPayload.results_count : undefined,
    total: typeof rawPayload.total === "number" ? rawPayload.total : undefined,
    savedSearch,
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

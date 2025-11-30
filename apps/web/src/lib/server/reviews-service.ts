'use server';

import type { HybridSearchSchema, SavedSearchRecord, SearchHistoryEvent } from '@/types/reviews';

function resolveApiBase() {
  return process.env.I4G_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? null;
}

function resolveApiKey() {
  return process.env.I4G_API_KEY ?? process.env.NEXT_PUBLIC_API_KEY ?? null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }
  if (typeof value === 'string' && value.length > 0) {
    return value.split(',').map((entry) => entry.trim()).filter(Boolean);
  }
  return [];
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
    Accept: 'application/json',
  };

  const apiKey = resolveApiKey();
  if (apiKey) {
    headers['X-API-KEY'] = apiKey;
  }

  const response = await fetch(url, { headers, cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Review service request failed with status ${response.status}`);
  }
  return (await response.json()) as unknown;
}

function mapHistoryEvent(payload: Record<string, unknown>): SearchHistoryEvent {
  const rawPayload = isPlainObject(payload.payload) ? payload.payload : {};
  const createdAt = typeof payload.created_at === 'string' ? payload.created_at : new Date().toISOString();
  const actor = typeof payload.actor === 'string' && payload.actor.length ? payload.actor : 'analyst';

  const fallbackId = `history-${Date.now()}-${Math.round(Math.random() * 1000)}`;
  return {
    id: typeof payload.action_id === 'string' ? payload.action_id : fallbackId,
    actor,
    createdAt,
    params: rawPayload,
    query:
      typeof rawPayload.query === 'string'
        ? rawPayload.query
        : typeof rawPayload.text === 'string'
          ? rawPayload.text
          : undefined,
    classification:
      typeof rawPayload.classification === 'string'
        ? rawPayload.classification
        : typeof rawPayload.taxonomy === 'string'
          ? rawPayload.taxonomy
          : undefined,
    caseId: typeof rawPayload.case_id === 'string' ? rawPayload.case_id : undefined,
    resultCount: typeof rawPayload.results_count === 'number' ? rawPayload.results_count : undefined,
    total: typeof rawPayload.total === 'number' ? rawPayload.total : undefined,
  } satisfies SearchHistoryEvent;
}

function mapSavedSearch(payload: Record<string, unknown>): SavedSearchRecord {
  const params = isPlainObject(payload.params) ? payload.params : {};
  const tags = toStringArray(payload.tags);

  const fallbackId = `saved-${Date.now()}-${Math.round(Math.random() * 1000)}`;
  return {
    id: typeof payload.search_id === 'string' ? payload.search_id : fallbackId,
    name: typeof payload.name === 'string' ? payload.name : 'Saved search',
    owner: typeof payload.owner === 'string' ? payload.owner : null,
    favorite: Boolean(payload.favorite),
    tags,
    createdAt: typeof payload.created_at === 'string' ? payload.created_at : new Date().toISOString(),
    params,
  } satisfies SavedSearchRecord;
}

const DEFAULT_SCHEMA: HybridSearchSchema = {
  indicatorTypes: [
    'bank_account',
    'crypto_wallet',
    'email',
    'phone',
    'ip_address',
    'asn',
    'browser_agent',
    'url',
    'merchant',
  ],
  datasets: ['retrieval_poc_dev', 'account_list'],
  classifications: ['romance', 'pig_butcher', 'tech_support'],
  lossBuckets: ['<10k', '10k-50k', '>50k'],
  timePresets: ['7d', '30d', '90d'],
};

const MOCK_HISTORY: SearchHistoryEvent[] = [
  {
    id: 'mock-history-1',
    actor: 'analyst_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    query: 'romance scam remittances',
    classification: 'romance_scam',
    resultCount: 8,
    total: 32,
    params: { query: 'romance scam remittances', taxonomy: ['romance_scam'] },
  },
  {
    id: 'mock-history-2',
    actor: 'analyst_2',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    query: 'wallet:0x94df intake',
    caseId: 'case-102',
    resultCount: 3,
    total: 3,
    params: { text: 'wallet:0x94df intake', case_id: 'case-102' },
  },
];

const MOCK_SAVED_SEARCHES: SavedSearchRecord[] = [
  {
    id: 'saved-mock-1',
    name: 'High-risk romance scams',
    owner: 'analyst_1',
    favorite: true,
    tags: ['romance', 'priority'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    params: { query: 'romance', taxonomy: ['romance_scam'], sources: ['intake'] },
  },
  {
    id: 'saved-mock-2',
    name: 'Crypto investment chatter',
    owner: 'shared',
    favorite: false,
    tags: ['crypto'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    params: { query: 'yield guarantee', taxonomy: ['crypto_investment'], sources: ['open-source'] },
  },
];

export async function getSearchHistory(limit = 10): Promise<SearchHistoryEvent[]> {
  try {
    const payload = await fetchJson('/reviews/search/history', { limit: String(limit) });
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
    console.warn('Falling back to mock search history', error);
    return MOCK_HISTORY.slice(0, limit);
  }
}

function mapHybridSearchSchemaPayload(value: Record<string, unknown>): HybridSearchSchema {
  return {
    indicatorTypes: toStringArray(value.indicator_types ?? value.indicatorTypes),
    datasets: toStringArray(value.datasets),
    classifications: toStringArray(value.classifications),
    lossBuckets: toStringArray(value.loss_buckets ?? value.lossBuckets),
    timePresets: toStringArray(value.time_presets ?? value.timePresets),
  } satisfies HybridSearchSchema;
}

export async function getHybridSearchSchema(): Promise<HybridSearchSchema> {
  try {
    const payload = await fetchJson('/reviews/search/schema');
    if (!payload || !isPlainObject(payload)) {
      return DEFAULT_SCHEMA;
    }
    return mapHybridSearchSchemaPayload(payload);
  } catch (error) {
    console.warn('Falling back to default hybrid search schema', error);
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
      params.owner_only = 'true';
    }
    const payload = await fetchJson('/reviews/search/saved', params);
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
    console.warn('Falling back to mock saved searches', error);
    return MOCK_SAVED_SEARCHES.slice(0, limit);
  }
}

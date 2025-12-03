import type { SearchEntityFilter, SearchRequest, SearchTimeRange } from "@i4g/sdk";

const TIME_PRESET_PATTERN = /^\s*(\d+)([dhm])\s*$/i;
const MATCH_MODES = new Set<SearchEntityFilter["matchMode"]>(["exact", "prefix", "contains"]);

export type SearchPayload = Partial<SearchRequest>;

type PlainObject = Record<string, unknown>;

export function isPlainObject(value: unknown): value is PlainObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
  }
  if (typeof value === "string" && value.length > 0) {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

export function deriveTimeRangeFromPreset(preset?: string | null): SearchTimeRange | undefined {
  if (!preset) {
    return undefined;
  }

  const match = TIME_PRESET_PATTERN.exec(preset);
  if (!match) {
    return undefined;
  }

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) {
    return undefined;
  }

  const unit = match[2].toLowerCase();
  const end = new Date();
  const start = new Date(end);

  if (unit === "d") {
    start.setUTCDate(start.getUTCDate() - amount);
  } else if (unit === "h") {
    start.setUTCHours(start.getUTCHours() - amount);
  } else if (unit === "m") {
    start.setUTCMinutes(start.getUTCMinutes() - amount);
  } else {
    return undefined;
  }

  return { start: start.toISOString(), end: end.toISOString() } satisfies SearchTimeRange;
}

export function normalizeEntityFilters(value: unknown): SearchEntityFilter[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is PlainObject => isPlainObject(entry))
    .map((entry) => {
      const type = typeof entry.type === "string" ? entry.type.trim() : "";
      const rawValue = typeof entry.value === "string" ? entry.value.trim() : "";
      const matchMode = typeof entry.matchMode === "string" && MATCH_MODES.has(entry.matchMode as SearchEntityFilter["matchMode"])
        ? (entry.matchMode as SearchEntityFilter["matchMode"])
        : "exact";

      return { type, value: rawValue, matchMode } satisfies SearchEntityFilter;
    })
    .filter((entry) => entry.type.length > 0 && entry.value.length > 0);
}

export function parseSearchPayloadParam(raw: string | string[] | undefined): SearchPayload | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isPlainObject(parsed)) {
      return null;
    }
    return parsed as SearchPayload;
  } catch (error) {
    console.warn("Failed to parse search payload", error);
    return null;
  }
}

export function serializeSearchPayloadParam(payload: unknown): string | null {
  if (!isPlainObject(payload)) {
    return null;
  }

  try {
    return JSON.stringify(payload);
  } catch (error) {
    console.warn("Failed to serialise search payload", error);
    return null;
  }
}

export function normalizeTimeRange(value: unknown): SearchTimeRange | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const start = typeof value.start === "string" ? value.start : null;
  const end = typeof value.end === "string" ? value.end : null;
  if (!start || !end) {
    return null;
  }

  return { start, end } satisfies SearchTimeRange;
}

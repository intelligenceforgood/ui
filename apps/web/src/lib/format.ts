/**
 * Shared formatting utilities.
 *
 * Consolidates the `formatDate` function that was previously duplicated across
 * cases/page, search-history-list, saved-searches-list, and dossier-utils.
 */

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

/**
 * Parse an ISO-8601 string into a `Date`, treating bare timestamps (no `Z` or
 * offset) as UTC.  API timestamps are stored in UTC but often lack the `Z`
 * suffix, so `new Date(raw)` would otherwise interpret them as local time.
 */
export function parseUTCDate(value: string): Date {
  const hasTimezone = /Z|[+-]\d{2}:\d{2}$/.test(value);
  return new Date(hasTimezone ? value : value + "Z");
}

/**
 * Format an ISO-8601 date string into a human-readable "medium date + short
 * time" string (e.g. "Nov 18, 2025, 1:04 PM").
 *
 * Returns "—" for nullish / empty values and the raw input string when
 * parsing fails.
 */
export function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }
  try {
    return dateFormatter.format(parseUTCDate(value));
  } catch {
    return value;
  }
}

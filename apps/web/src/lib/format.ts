/**
 * Shared formatting utilities.
 *
 * Consolidates the `formatDate` function that was previously duplicated across
 * cases/page, search-history-list, saved-searches-list, account-list-console,
 * and dossier-utils.
 */

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

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
    return dateFormatter.format(new Date(value));
  } catch {
    return value;
  }
}

/**
 * Taxonomy helpers shared across the console UI.
 *
 * Consolidates the `getTaxonomyDescription` function that was previously
 * duplicated in `cases/page.tsx` and `search/search-types.ts`.
 */
import type { TaxonomyResponse } from "@i4g/sdk";

/**
 * Look up a taxonomy item description by its `code` or `label`.
 *
 * Iterates all axes and returns the first matching item's description,
 * or an empty string when no match is found.
 */
export function getTaxonomyDescription(
  taxonomy: TaxonomyResponse,
  label: string,
): string {
  if (!taxonomy?.axes) return "";
  for (const axis of taxonomy.axes) {
    const item = axis.items.find((i) => i.code === label || i.label === label);
    if (item) return item.description;
  }
  return "";
}

/**
 * Look up a taxonomy item's human-friendly display label by its code.
 *
 * For example, `INTENT.INVESTMENT` returns `"Investment"` and
 * `CHANNEL.WEB` returns `"Web"`.
 *
 * Falls back to a title-cased suffix when the code is not found
 * (e.g. `INTENT.UNKNOWN` → `"Unknown"`).
 */
export function getTaxonomyLabel(
  taxonomy: TaxonomyResponse,
  code: string,
): string {
  if (taxonomy?.axes) {
    for (const axis of taxonomy.axes) {
      const item = axis.items.find((i) => i.code === code || i.label === code);
      if (item) return item.label;
    }
  }
  // Graceful fallback: strip prefix and title-case
  const suffix = code.includes(".") ? code.split(".").pop()! : code;
  return suffix
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

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

import type { SearchResponse, TaxonomyResponse } from "@i4g/sdk";
import type {
  HybridSearchSchema,
  SavedSearchDescriptor,
} from "@/types/reviews";

/* ─── helper ─── */

export { getTaxonomyDescription } from "@/lib/taxonomy";

/* ─── types ─── */

export type MatchMode = "exact" | "prefix" | "contains";

export type EntityFilterRow = {
  id: string;
  type: string;
  value: string;
  matchMode: MatchMode;
};

export type InitialEntityFilter = Omit<EntityFilterRow, "id"> & { id?: string };

export type InitialSelection = Partial<{
  sources: string[];
  taxonomy: string[];
  indicatorTypes: string[];
  datasets: string[];
  timePreset: string | null;
  entities: InitialEntityFilter[];
}>;

export type FacetSelection = {
  sources: string[];
  taxonomy: string[];
  indicatorTypes: string[];
  datasets: string[];
  timePreset: string | null;
};

export type FacetField = "sources" | "taxonomy";

export type SearchOverrides = Partial<{
  query: string;
  sources: string[];
  taxonomy: string[];
  indicatorTypes: string[];
  datasets: string[];
  timePreset: string | null;
  entities: EntityFilterRow[];
}>;

export type BuildSearchRequestOptions = {
  includeSavedSearchContext?: boolean;
};

export type SearchExperienceProps = {
  initialResults: SearchResponse;
  taxonomy: TaxonomyResponse;
  initialSelection?: InitialSelection;
  initialSavedSearch?: SavedSearchDescriptor | null;
  schema: HybridSearchSchema;
};

/* ─── constants ─── */

export const facetFieldMap: Record<string, FacetField> = {
  source: "sources",
  taxonomy: "taxonomy",
};

export const sourceColors: Record<string, string> = {
  customs: "text-amber-600 bg-amber-50",
  intake: "text-emerald-600 bg-emerald-50",
  "open-source": "text-sky-600 bg-sky-50",
  financial: "text-purple-600 bg-purple-50",
};

export const DEFAULT_ENTITY_TYPE = "bank_account";
export const MATCH_MODE_OPTIONS: MatchMode[] = ["exact", "prefix", "contains"];

/* ─── id generator ─── */

export const generateEntityFilterId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `entity-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
};

/* ─── row builder ─── */

export const buildEntityFilterRows = (
  entries: InitialEntityFilter[] | undefined,
  fallbackType: string,
): EntityFilterRow[] =>
  (entries ?? []).map((filter) => ({
    id: filter.id ?? generateEntityFilterId(),
    type: filter.type || fallbackType,
    value: filter.value ?? "",
    matchMode: filter.matchMode ?? "exact",
  }));

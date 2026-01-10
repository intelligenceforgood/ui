import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { Badge, Card } from "@i4g/ui-kit";
import type { SearchRequest, SearchTimeRange } from "@i4g/sdk";
import { getI4GClient } from "@/lib/i4g-client";
import SearchExperience from "./search-experience";
import {
  getHybridSearchSchema,
  getSearchHistory,
  listSavedSearches,
} from "@/lib/server/reviews-service";
import { SearchHistoryList } from "./search-history-list";
import { SavedSearchesList } from "./saved-searches-list";
import {
  deriveTimeRangeFromPreset,
  normalizeEntityFilters,
  normalizeTimeRange,
  parseSearchPayloadParam,
  toStringArray,
} from "@/lib/search/filters";
import type { SavedSearchDescriptor } from "@/types/reviews";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Cross-intelligence search across filings, chatter, and partner data.",
};

type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function toArrayParam(value: string | string[] | undefined): string[] {
  return toStringArray(value);
}

function toSingleParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : null;
  }
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parseTimeRangeParams(
  startValue: string | string[] | undefined,
  endValue: string | string[] | undefined,
): SearchTimeRange | null {
  const start = toSingleParam(startValue);
  const end = toSingleParam(endValue);
  if (start && end) {
    return { start, end } satisfies SearchTimeRange;
  }
  return null;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const client = getI4GClient();
  const resolvedSearchParams = (await searchParams) ?? {};
  const payload = parseSearchPayloadParam(resolvedSearchParams.payload);
  const payloadRecord = payload as Record<string, unknown> | null;
  const savedSearchLabel = toSingleParam(
    resolvedSearchParams.savedSearchLabel ??
      resolvedSearchParams.saved_search_label,
  );
  const savedSearchIdFromParam = toSingleParam(
    resolvedSearchParams.savedSearchId ?? resolvedSearchParams.saved_search_id,
  );
  const savedSearchIdFromPayload =
    typeof payloadRecord?.["saved_search_id"] === "string"
      ? (payloadRecord["saved_search_id"] as string)
      : typeof payloadRecord?.["savedSearchId"] === "string"
        ? (payloadRecord["savedSearchId"] as string)
        : typeof payloadRecord?.["search_id"] === "string"
          ? (payloadRecord["search_id"] as string)
          : null;
  const savedSearchId = savedSearchIdFromParam ?? savedSearchIdFromPayload;
  const savedSearchNameFromPayload =
    typeof payloadRecord?.["saved_search_name"] === "string"
      ? (payloadRecord["saved_search_name"] as string)
      : typeof payloadRecord?.["savedSearchName"] === "string"
        ? (payloadRecord["savedSearchName"] as string)
        : null;
  const savedSearchName =
    savedSearchLabel ?? savedSearchNameFromPayload ?? null;
  const savedSearchOwner =
    typeof payloadRecord?.["saved_search_owner"] === "string"
      ? (payloadRecord["saved_search_owner"] as string)
      : typeof payloadRecord?.["savedSearchOwner"] === "string"
        ? (payloadRecord["savedSearchOwner"] as string)
        : null;
  const savedSearchTags = toStringArray(
    (payloadRecord?.["saved_search_tags"] as unknown) ??
      (payloadRecord?.["savedSearchTags"] as unknown),
  );
  const savedSearchDescriptor: SavedSearchDescriptor | null =
    savedSearchId ||
    savedSearchName ||
    savedSearchOwner ||
    savedSearchTags.length
      ? {
          id: savedSearchId ?? undefined,
          name: savedSearchName ?? undefined,
          owner: savedSearchOwner ?? null,
          tags: savedSearchTags,
        }
      : null;

  const queryFromUrl =
    typeof resolvedSearchParams.query === "string"
      ? resolvedSearchParams.query
      : "";
  const queryFromPayload =
    typeof payload?.query === "string"
      ? payload.query
      : payloadRecord && typeof payloadRecord["text"] === "string"
        ? (payloadRecord["text"] as string)
        : "";
  const resolvedQuery = queryFromPayload || queryFromUrl;

  const sourcesFromUrl = toArrayParam(resolvedSearchParams.sources);
  const taxonomyFromUrl = toArrayParam(resolvedSearchParams.taxonomy);
  const indicatorsFromUrl = toArrayParam(
    resolvedSearchParams.indicatorTypes ?? resolvedSearchParams.indicators,
  );
  const datasetsFromUrl = toArrayParam(resolvedSearchParams.datasets);
  const timePresetFromUrl = toSingleParam(
    resolvedSearchParams.timePreset ?? resolvedSearchParams.time_preset,
  );
  const timeRangeFromUrl = parseTimeRangeParams(
    resolvedSearchParams.timeStart,
    resolvedSearchParams.timeEnd,
  );

  const sourcesFromPayload = toStringArray(payload?.sources);
  const taxonomyFromPayload = toStringArray(
    payload?.taxonomy ?? payload?.classifications,
  );
  const indicatorsFromPayload = toStringArray(
    payload?.indicatorTypes ?? payloadRecord?.indicator_types,
  );
  const datasetsFromPayload = toStringArray(payload?.datasets);
  const timePresetFromPayload = toSingleParam(
    payload?.timePreset ?? (payloadRecord?.time_preset as string | undefined),
  );
  const timeRangeFromPayload = normalizeTimeRange(
    payload?.timeRange ?? payloadRecord?.time_range,
  );
  const entityFilters = normalizeEntityFilters(
    payload?.entities ?? payloadRecord?.entities,
  );

  const selectionSources = sourcesFromPayload.length
    ? sourcesFromPayload
    : sourcesFromUrl;
  const selectionTaxonomy = taxonomyFromPayload.length
    ? taxonomyFromPayload
    : taxonomyFromUrl;
  const selectionIndicatorTypes = indicatorsFromPayload.length
    ? indicatorsFromPayload
    : indicatorsFromUrl;
  const selectionDatasets = datasetsFromPayload.length
    ? datasetsFromPayload
    : datasetsFromUrl;
  const resolvedTimePreset = timePresetFromPayload ?? timePresetFromUrl;
  const resolvedTimeRange =
    timeRangeFromPayload ??
    timeRangeFromUrl ??
    deriveTimeRangeFromPreset(resolvedTimePreset ?? undefined);

  const page =
    typeof payload?.page === "number" && payload.page >= 1 ? payload.page : 1;
  const pageSize =
    typeof payload?.pageSize === "number" && payload.pageSize >= 1
      ? payload.pageSize
      : 10;

  const initialSearchRequest: SearchRequest = {
    query: resolvedQuery,
    page,
    pageSize,
    sources: selectionSources.length ? selectionSources : undefined,
    taxonomy: selectionTaxonomy.length ? selectionTaxonomy : undefined,
    classifications: selectionTaxonomy.length ? selectionTaxonomy : undefined,
    indicatorTypes: selectionIndicatorTypes.length
      ? selectionIndicatorTypes
      : undefined,
    datasets: selectionDatasets.length ? selectionDatasets : undefined,
    timePreset: resolvedTimePreset ?? undefined,
    timeRange: resolvedTimeRange ?? undefined,
    entities: entityFilters.length ? entityFilters : undefined,
    savedSearchId: savedSearchId ?? undefined,
    savedSearchName: savedSearchName ?? undefined,
    savedSearchOwner: savedSearchOwner ?? undefined,
    savedSearchTags: savedSearchTags.length ? savedSearchTags : undefined,
  };

  const initialResults = await client.searchIntelligence(initialSearchRequest);

  const [schema, history, savedSearches, taxonomy] = await Promise.all([
    getHybridSearchSchema(),
    getSearchHistory(6),
    listSavedSearches({ limit: 6 }),
    client.getTaxonomy(),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Intelligence search
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Search signals, cases, and chatter
        </h1>
        <p className="max-w-3xl text-sm text-slate-500">
          Query across structured and unstructured datasets. Filters instantly
          narrow results by source, taxonomy, or time.
        </p>
      </header>

      <Card className="flex flex-col gap-3 border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Sparkles className="h-4 w-4 text-teal-500" />
          <span>
            {initialResults.stats.total} intelligence hits indexed ·{" "}
            {initialResults.suggestions.length} auto-suggestions ready
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {initialResults.facets.slice(0, 3).map((facet) => (
            <Badge key={facet.field} variant="info">
              {facet.label}: {facet.options.length} options
            </Badge>
          ))}
        </div>
      </Card>

      {savedSearchLabel ? (
        <Card className="border-teal-200 bg-teal-50 text-sm text-teal-700">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-500">
            Saved search
          </p>
          <p className="text-base font-semibold text-teal-800">
            {savedSearchLabel}
          </p>
        </Card>
      ) : null}

      <SearchExperience
        initialResults={initialResults}
        taxonomy={taxonomy}
        initialSelection={{
          sources: selectionSources,
          taxonomy: selectionTaxonomy,
          indicatorTypes: selectionIndicatorTypes,
          datasets: selectionDatasets,
          timePreset: resolvedTimePreset ?? null,
          entities: entityFilters,
        }}
        initialSavedSearch={savedSearchDescriptor}
        schema={schema}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <SearchHistoryList events={history} />
        <SavedSearchesList items={savedSearches} />
      </section>
    </div>
  );
}

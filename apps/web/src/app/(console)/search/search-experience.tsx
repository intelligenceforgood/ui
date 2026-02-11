"use client";

import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Input } from "@i4g/ui-kit";
import type { SearchRequest, SearchResponse } from "@i4g/sdk";
import type { SavedSearchDescriptor } from "@/types/reviews";
import { deriveTimeRangeFromPreset } from "@/lib/search/filters";
import { buildSearchHref } from "@/lib/search-links";
import {
  BookmarkPlus,
  Loader2,
  RefreshCcw,
  Search,
  Sparkles,
} from "lucide-react";

import {
  type BuildSearchRequestOptions,
  type EntityFilterRow,
  type FacetField,
  type FacetSelection,
  type SearchExperienceProps,
  type SearchOverrides,
  DEFAULT_ENTITY_TYPE,
  buildEntityFilterRows,
  generateEntityFilterId,
} from "./search-types";
import { SearchFilterSidebar } from "./search-filter-sidebar";
import { SearchResultCard } from "./search-result-card";

export default function SearchExperience({
  initialResults,
  taxonomy,
  initialSelection,
  initialSavedSearch,
  schema,
}: SearchExperienceProps) {
  const indicatorOptions = schema.indicatorTypes.length
    ? schema.indicatorTypes
    : [DEFAULT_ENTITY_TYPE];
  const entityExampleMap = useMemo(
    () => schema.entityExamples ?? {},
    [schema.entityExamples],
  );
  const defaultIndicatorType = indicatorOptions[0] ?? DEFAULT_ENTITY_TYPE;
  const normalizedInitialSelection = useMemo<FacetSelection>(
    () => ({
      sources: [...(initialSelection?.sources ?? [])],
      taxonomy: [...(initialSelection?.taxonomy ?? [])],
      indicatorTypes: [...(initialSelection?.indicatorTypes ?? [])],
      datasets: [...(initialSelection?.datasets ?? [])],
      timePreset: initialSelection?.timePreset ?? null,
    }),
    [initialSelection],
  );
  const normalizedInitialEntityFilters = useMemo(
    () =>
      buildEntityFilterRows(initialSelection?.entities, defaultIndicatorType),
    [initialSelection, defaultIndicatorType],
  );
  const normalizedInitialSavedSearch =
    useMemo<SavedSearchDescriptor | null>(() => {
      if (!initialSavedSearch) {
        return null;
      }
      const tags = Array.isArray(initialSavedSearch.tags)
        ? initialSavedSearch.tags
        : [];
      if (
        (initialSavedSearch.id && initialSavedSearch.id.length > 0) ||
        (initialSavedSearch.name && initialSavedSearch.name.length > 0) ||
        tags.length > 0 ||
        typeof initialSavedSearch.owner === "string"
      ) {
        return {
          id: initialSavedSearch.id,
          name: initialSavedSearch.name,
          owner: initialSavedSearch.owner ?? null,
          tags,
        } satisfies SavedSearchDescriptor;
      }
      return null;
    }, [initialSavedSearch]);
  const [query, setQuery] = useState(initialResults.stats.query ?? "");
  const [results, setResults] = useState<SearchResponse>(initialResults);
  const [selection, setSelection] = useState<FacetSelection>(
    normalizedInitialSelection,
  );
  const [entityFilters, setEntityFilters] = useState<EntityFilterRow[]>(
    normalizedInitialEntityFilters,
  );
  const [savedSearchContext, setSavedSearchContext] =
    useState<SavedSearchDescriptor | null>(normalizedInitialSavedSearch);

  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingSearch, setIsSavingSearch] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const router = useRouter();
  const schemaSummary = useMemo(
    () => ({
      indicatorTypes: schema.indicatorTypes.length,
      datasets: schema.datasets.length,
      timePresets: schema.timePresets.length,
    }),
    [
      schema.indicatorTypes.length,
      schema.datasets.length,
      schema.timePresets.length,
    ],
  );

  const buildSearchRequestPayload = useCallback(
    (
      overrides?: SearchOverrides,
      appliedSelection?: FacetSelection,
      appliedEntities?: EntityFilterRow[],
      options?: BuildSearchRequestOptions,
    ): SearchRequest => {
      const effectiveSelection = appliedSelection ?? selection;
      const effectiveEntities = appliedEntities ?? entityFilters;
      const nextQuery = overrides?.query ?? query;
      const trimmedQuery =
        typeof nextQuery === "string" ? nextQuery.trim() : "";
      const nextSources = overrides?.sources ?? effectiveSelection.sources;
      const nextTaxonomy = overrides?.taxonomy ?? effectiveSelection.taxonomy;
      const nextIndicatorTypes =
        overrides?.indicatorTypes ?? effectiveSelection.indicatorTypes;
      const nextDatasets = overrides?.datasets ?? effectiveSelection.datasets;
      const nextTimePreset =
        overrides &&
        Object.prototype.hasOwnProperty.call(overrides, "timePreset")
          ? overrides.timePreset ?? null
          : effectiveSelection.timePreset;
      const nextEntities = overrides?.entities ?? effectiveEntities;
      const timeRange = deriveTimeRangeFromPreset(nextTimePreset ?? undefined);
      const entityPayload = nextEntities
        .filter((filter) => filter.value.trim().length > 0)
        .map((filter) => ({
          type: filter.type,
          value: filter.value.trim(),
          matchMode: filter.matchMode,
        }));

      const requestBody: SearchRequest = {
        query: trimmedQuery,
        page: 1,
        pageSize: results.stats.pageSize,
      } satisfies SearchRequest;

      if (nextSources.length) {
        requestBody.sources = nextSources;
      }
      if (nextTaxonomy.length) {
        requestBody.taxonomy = nextTaxonomy;
        requestBody.classifications = nextTaxonomy;
      }
      if (nextIndicatorTypes.length) {
        requestBody.indicatorTypes = nextIndicatorTypes;
      }
      if (nextDatasets.length) {
        requestBody.datasets = nextDatasets;
      }
      if (nextTimePreset) {
        requestBody.timePreset = nextTimePreset;
      }
      if (timeRange) {
        requestBody.timeRange = timeRange;
      }
      if (entityPayload.length) {
        requestBody.entities = entityPayload;
      }

      if (options?.includeSavedSearchContext !== false && savedSearchContext) {
        if (savedSearchContext.id) {
          requestBody.savedSearchId = savedSearchContext.id;
        }
        if (savedSearchContext.name) {
          requestBody.savedSearchName = savedSearchContext.name;
        }
        if (savedSearchContext.owner) {
          requestBody.savedSearchOwner = savedSearchContext.owner;
        }
        if (savedSearchContext.tags?.length) {
          requestBody.savedSearchTags = savedSearchContext.tags;
        }
      }

      return requestBody;
    },
    [
      entityFilters,
      query,
      results.stats.pageSize,
      savedSearchContext,
      selection,
    ],
  );

  useEffect(() => {
    setResults(initialResults);
    setQuery(initialResults.stats.query ?? "");
    setExpandedResultId(null);
  }, [initialResults]);

  useEffect(() => {
    setSelection(normalizedInitialSelection);
  }, [normalizedInitialSelection]);

  useEffect(() => {
    setEntityFilters(normalizedInitialEntityFilters);
  }, [normalizedInitialEntityFilters]);

  useEffect(() => {
    setSavedSearchContext(normalizedInitialSavedSearch);
  }, [normalizedInitialSavedSearch]);

  const triggerSearch = useCallback(
    (
      overrides?: SearchOverrides,
      appliedSelection?: FacetSelection,
      appliedEntities?: EntityFilterRow[],
      options?: BuildSearchRequestOptions,
    ) => {
      const requestBody = buildSearchRequestPayload(
        overrides,
        appliedSelection,
        appliedEntities,
        options,
      );
      const savedSearchLabel =
        typeof requestBody.savedSearchName === "string" &&
        requestBody.savedSearchName.length
          ? requestBody.savedSearchName
          : typeof requestBody.savedSearchId === "string" &&
              requestBody.savedSearchId.length
            ? requestBody.savedSearchId
            : null;
      const nextHref = buildSearchHref(
        requestBody,
        savedSearchLabel ? { label: savedSearchLabel } : undefined,
      );
      startTransition(() => {
        setError(null);
        router.replace(nextHref, { scroll: false });
      });
    },
    [buildSearchRequestPayload, router],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      triggerSearch();
    },
    [triggerSearch],
  );

  const handleQueryChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSavedSearchContext(null);
      setQuery(event.target.value);
    },
    [],
  );

  const toggleFacet = useCallback(
    (field: FacetField, value: string) => {
      setSavedSearchContext(null);
      const alreadySelected = selection[field].includes(value);
      const nextValues = alreadySelected
        ? selection[field].filter((item) => item !== value)
        : [...selection[field], value];
      const nextSelection: FacetSelection = {
        ...selection,
        [field]: nextValues,
      };
      setSelection(nextSelection);
      triggerSearch(
        { [field]: nextValues } as SearchOverrides,
        nextSelection,
        undefined,
        {
          includeSavedSearchContext: false,
        },
      );
    },
    [selection, triggerSearch],
  );

  const toggleIndicatorType = useCallback(
    (value: string) => {
      setSavedSearchContext(null);
      const alreadySelected = selection.indicatorTypes.includes(value);
      const nextValues = alreadySelected
        ? selection.indicatorTypes.filter((item) => item !== value)
        : [...selection.indicatorTypes, value];
      const nextSelection: FacetSelection = {
        ...selection,
        indicatorTypes: nextValues,
      };
      setSelection(nextSelection);
      triggerSearch({ indicatorTypes: nextValues }, nextSelection, undefined, {
        includeSavedSearchContext: false,
      });
    },
    [selection, triggerSearch],
  );

  const toggleDataset = useCallback(
    (value: string) => {
      setSavedSearchContext(null);
      const alreadySelected = selection.datasets.includes(value);
      const nextValues = alreadySelected
        ? selection.datasets.filter((item) => item !== value)
        : [...selection.datasets, value];
      const nextSelection: FacetSelection = {
        ...selection,
        datasets: nextValues,
      };
      setSelection(nextSelection);
      triggerSearch({ datasets: nextValues }, nextSelection, undefined, {
        includeSavedSearchContext: false,
      });
    },
    [selection, triggerSearch],
  );

  const toggleTimePreset = useCallback(
    (value: string) => {
      setSavedSearchContext(null);
      const nextPreset = selection.timePreset === value ? null : value;
      const nextSelection: FacetSelection = {
        ...selection,
        timePreset: nextPreset,
      };
      setSelection(nextSelection);
      triggerSearch({ timePreset: nextPreset }, nextSelection, undefined, {
        includeSavedSearchContext: false,
      });
    },
    [selection, triggerSearch],
  );

  const addEntityFilter = useCallback(() => {
    setSavedSearchContext(null);
    setEntityFilters((current) => [
      ...current,
      {
        id: generateEntityFilterId(),
        type: defaultIndicatorType,
        value: "",
        matchMode: "exact",
      },
    ]);
  }, [defaultIndicatorType]);

  const updateEntityFilter = useCallback(
    (id: string, patch: Partial<EntityFilterRow>) => {
      setSavedSearchContext(null);
      setEntityFilters((current) =>
        current.map((entry) =>
          entry.id === id ? { ...entry, ...patch } : entry,
        ),
      );
    },
    [],
  );

  const removeEntityFilter = useCallback((id: string) => {
    setSavedSearchContext(null);
    setEntityFilters((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const resetEntityFilters = useCallback(() => {
    setSavedSearchContext(null);
    setEntityFilters([]);
    triggerSearch({ entities: [] }, undefined, [], {
      includeSavedSearchContext: false,
    });
  }, [triggerSearch]);

  const applyEntityFilters = useCallback(() => {
    triggerSearch({ entities: entityFilters }, undefined, entityFilters);
  }, [entityFilters, triggerSearch]);

  const clearFilters = useCallback(() => {
    setSavedSearchContext(null);
    const cleared: FacetSelection = {
      sources: [],
      taxonomy: [],
      indicatorTypes: [],
      datasets: [],
      timePreset: null,
    };
    setSelection(cleared);
    setEntityFilters([]);
    triggerSearch(
      {
        sources: [],
        taxonomy: [],
        indicatorTypes: [],
        datasets: [],
        timePreset: null,
        entities: [],
      },
      cleared,
      [],
      { includeSavedSearchContext: false },
    );
  }, [triggerSearch]);

  const toggleDetails = useCallback((id: string) => {
    setExpandedResultId((current) => (current === id ? null : id));
  }, []);

  const handleSaveSearch = useCallback(() => {
    setSaveError(null);
    setSaveMessage(null);
    const requestPayload = buildSearchRequestPayload(
      undefined,
      undefined,
      undefined,
      {
        includeSavedSearchContext: false,
      },
    );
    const trimmedQuery =
      typeof requestPayload.query === "string"
        ? requestPayload.query.trim()
        : "";
    const hasFilters =
      Boolean(trimmedQuery) ||
      Boolean(requestPayload.sources && requestPayload.sources.length) ||
      Boolean(requestPayload.taxonomy && requestPayload.taxonomy.length) ||
      Boolean(
        requestPayload.indicatorTypes && requestPayload.indicatorTypes.length,
      ) ||
      Boolean(requestPayload.datasets && requestPayload.datasets.length) ||
      Boolean(requestPayload.timePreset) ||
      Boolean(requestPayload.timeRange) ||
      Boolean(requestPayload.entities && requestPayload.entities.length);
    if (!hasFilters) {
      setSaveError("Provide a query or filters before saving.");
      return;
    }

    const suggestedName = trimmedQuery || "Untitled search";
    const name =
      typeof window !== "undefined"
        ? window.prompt("Name this search", suggestedName)
        : suggestedName;
    if (!name) {
      return;
    }

    setIsSavingSearch(true);
    void fetch("/api/reviews/saved", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        params: requestPayload,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const details = await response.json().catch(() => ({}));
          const message =
            typeof details.error === "string"
              ? details.error
              : "Unable to save search";
          throw new Error(message);
        }
        setSaveMessage(`Saved "${name}"`);
        router.refresh();
        setTimeout(() => setSaveMessage(null), 6000);
      })
      .catch((saveErr: Error) => {
        setSaveError(saveErr.message || "Unable to save search");
      })
      .finally(() => {
        setIsSavingSearch(false);
      });
  }, [buildSearchRequestPayload, router]);

  const activeEntityCount = useMemo(
    () =>
      entityFilters.filter((filter) => filter.value.trim().length > 0).length,
    [entityFilters],
  );

  const hasActiveFilters = useMemo(
    () =>
      selection.sources.length > 0 ||
      selection.taxonomy.length > 0 ||
      selection.indicatorTypes.length > 0 ||
      selection.datasets.length > 0 ||
      Boolean(selection.timePreset) ||
      activeEntityCount > 0,
    [
      selection.sources.length,
      selection.taxonomy.length,
      selection.indicatorTypes.length,
      selection.datasets.length,
      selection.timePreset,
      activeEntityCount,
    ],
  );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 lg:flex-row lg:items-center"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              name="query"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search by entity, behaviour, or case ID"
              className="pl-9"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={clearFilters}
              disabled={isPending}
            >
              <RefreshCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleSaveSearch}
              disabled={isPending || isSavingSearch}
            >
              {isSavingSearch ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BookmarkPlus className="h-4 w-4" />
              )}
              Save search
            </Button>
          </div>
        </form>

        <div className="mt-4 grid gap-4 lg:grid-cols-[260px_1fr]">
          <SearchFilterSidebar
            schema={schema}
            selection={selection}
            entityFilters={entityFilters}
            schemaSummary={schemaSummary}
            results={results}
            activeEntityCount={activeEntityCount}
            isPending={isPending}
            indicatorOptions={indicatorOptions}
            entityExampleMap={entityExampleMap}
            toggleFacet={toggleFacet}
            toggleIndicatorType={toggleIndicatorType}
            toggleDataset={toggleDataset}
            toggleTimePreset={toggleTimePreset}
            addEntityFilter={addEntityFilter}
            updateEntityFilter={updateEntityFilter}
            removeEntityFilter={removeEntityFilter}
            resetEntityFilters={resetEntityFilters}
            applyEntityFilters={applyEntityFilters}
          />

          <div className="relative space-y-4" aria-busy={isPending}>
            {isPending ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/80 backdrop-blur-sm dark:bg-slate-900/60">
                <div className="flex flex-col items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-200">
                  <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                  <span>Searching across structured + semantic signals…</span>
                  <span className="text-xs font-normal text-slate-400">
                    Large corpora can take a few seconds.
                  </span>
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <Badge variant="info">
                {results.stats.total} results in{" "}
                {Math.round(results.stats.took)} ms
              </Badge>
              {isPending ? (
                <Badge variant="default" className="animate-pulse">
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />{" "}
                  Gathering signals…
                </Badge>
              ) : null}
              {selection.sources.map((source) => (
                <Badge key={`source-${source}`} variant="success">
                  Source: {source}
                </Badge>
              ))}
              {selection.taxonomy.map((tag) => (
                <Badge key={`tax-${tag}`} variant="warning">
                  Tag: {tag}
                </Badge>
              ))}
              {selection.indicatorTypes.map((indicator) => (
                <Badge key={`indicator-${indicator}`} variant="info">
                  Indicator: {indicator}
                </Badge>
              ))}
              {selection.datasets.map((dataset) => (
                <Badge key={`dataset-${dataset}`} variant="info">
                  Dataset: {dataset}
                </Badge>
              ))}
              {selection.timePreset ? (
                <Badge variant="warning">
                  Time: last {selection.timePreset}
                </Badge>
              ) : null}
              {activeEntityCount ? (
                <Badge variant="default">
                  {activeEntityCount} entity filter
                  {activeEntityCount === 1 ? "" : "s"}
                </Badge>
              ) : null}
              {!hasActiveFilters && !isPending ? (
                <span className="text-slate-400">No filters applied</span>
              ) : null}
            </div>

            {error ? (
              <Card className="border-rose-200 bg-rose-50 text-sm text-rose-600">
                {error}
              </Card>
            ) : null}

            {saveMessage ? (
              <Card className="border-teal-200 bg-teal-50 text-sm text-teal-700">
                {saveMessage}
              </Card>
            ) : null}
            {saveError ? (
              <Card className="border-amber-200 bg-amber-50 text-sm text-amber-700">
                {saveError}
              </Card>
            ) : null}

            {results.suggestions.length ? (
              <Card className="border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-500">
                <p className="font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Suggestions
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {results.suggestions.map((suggestion, suggestionIndex) => (
                    <button
                      key={`${suggestion}-${suggestionIndex}`}
                      type="button"
                      onClick={() => triggerSearch({ query: suggestion })}
                      className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-teal-200 hover:text-teal-700"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </Card>
            ) : null}

            <ul className="space-y-4">
              {results.results.map((result, index) => (
                <SearchResultCard
                  key={`${result.id ?? "result"}-${index}`}
                  result={result}
                  index={index}
                  taxonomy={taxonomy}
                  isExpanded={expandedResultId === result.id}
                  onToggleDetails={toggleDetails}
                />
              ))}
            </ul>

            {results.results.length === 0 ? (
              <Card className="flex flex-col items-center gap-3 border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
                <Sparkles className="h-6 w-6 text-slate-400" />
                <p>
                  No results yet. Try broadening your query or remove filters.
                </p>
              </Card>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}

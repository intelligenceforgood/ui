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
import type { SearchRequest, SearchResponse, TaxonomyResponse } from "@i4g/sdk";
import type { SavedSearchDescriptor } from "@/types/reviews";
import type { HybridSearchSchema } from "@/types/reviews";
import { deriveTimeRangeFromPreset } from "@/lib/search/filters";
import { buildSearchHref } from "@/lib/search-links";

import {
  type BuildSearchRequestOptions,
  type EntityFilterRow,
  type FacetField,
  type FacetSelection,
  type InitialSelection,
  type SearchOverrides,
  DEFAULT_ENTITY_TYPE,
  buildEntityFilterRows,
} from "./search-types";
import { useEntityFilters } from "./use-entity-filters";
import { useSavedSearch } from "./use-saved-search";

/* ─── hook input ─── */

export interface UseSearchStateOptions {
  initialResults: SearchResponse;
  taxonomy: TaxonomyResponse;
  initialSelection?: InitialSelection;
  initialSavedSearch?: SavedSearchDescriptor | null;
  schema: HybridSearchSchema;
}

/* ─── hook ─── */

export function useSearchState({
  initialResults,
  initialSelection,
  initialSavedSearch,
  schema,
}: UseSearchStateOptions) {
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
  const [savedSearchContext, setSavedSearchContext] =
    useState<SavedSearchDescriptor | null>(normalizedInitialSavedSearch);

  const normalizedInitialEntityFilters = useMemo(
    () =>
      buildEntityFilterRows(initialSelection?.entities, defaultIndicatorType),
    [initialSelection, defaultIndicatorType],
  );
  const [entityFilters, setEntityFilters] = useState<EntityFilterRow[]>(
    normalizedInitialEntityFilters,
  );

  const [error, setError] = useState<string | null>(null);
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

  /* ─── payload builder ─── */

  const buildSearchRequestPayload = useCallback(
    (
      overrides?: SearchOverrides,
      appliedSelection?: FacetSelection,
      appliedEntities?: EntityFilterRow[],
      options?: BuildSearchRequestOptions,
    ): SearchRequest => {
      const effectiveSelection = appliedSelection ?? selection;
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
      const nextEntities =
        overrides?.entities ?? appliedEntities ?? entityFilters;
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

  /* ─── sync effects ─── */

  useEffect(() => {
    setResults(initialResults);
    setQuery(initialResults.stats.query ?? "");
    setExpandedResultId(null);
  }, [initialResults]);

  useEffect(() => {
    setSelection(normalizedInitialSelection);
  }, [normalizedInitialSelection]);

  useEffect(() => {
    setSavedSearchContext(normalizedInitialSavedSearch);
  }, [normalizedInitialSavedSearch]);

  useEffect(() => {
    setEntityFilters(normalizedInitialEntityFilters);
  }, [normalizedInitialEntityFilters]);

  /* ─── search trigger ─── */

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

  /* ─── clear saved search context helper (passed to sub-hooks) ─── */

  const clearSavedSearchContext = useCallback(() => {
    setSavedSearchContext(null);
  }, []);

  /* ─── entity filters (extracted hook) ─── */

  const {
    addEntityFilter,
    updateEntityFilter,
    removeEntityFilter,
    resetEntityFilters,
    applyEntityFilters,
    activeEntityCount,
  } = useEntityFilters({
    entityFilters,
    setEntityFilters,
    defaultIndicatorType,
    onClearSavedSearch: clearSavedSearchContext,
    triggerSearch,
  });

  /* ─── saved search (extracted hook) ─── */

  const { isSavingSearch, saveMessage, saveError, handleSaveSearch } =
    useSavedSearch({ buildSearchRequestPayload });

  /* ─── event handlers ─── */

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

  /* ─── facet toggles ─── */

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
        { includeSavedSearchContext: false },
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

  /* ─── clear all ─── */

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
    resetEntityFilters();
  }, [resetEntityFilters]);

  /* ─── toggle result details ─── */

  const toggleDetails = useCallback((id: string) => {
    setExpandedResultId((current) => (current === id ? null : id));
  }, []);

  /* ─── derived state ─── */

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

  return {
    /* state */
    query,
    results,
    selection,
    entityFilters,
    error,
    saveMessage,
    saveError,
    isSavingSearch,
    isPending,
    expandedResultId,

    /* derived */
    indicatorOptions,
    entityExampleMap,
    schemaSummary,
    activeEntityCount,
    hasActiveFilters,

    /* actions */
    handleSubmit,
    handleQueryChange,
    toggleFacet,
    toggleIndicatorType,
    toggleDataset,
    toggleTimePreset,
    addEntityFilter,
    updateEntityFilter,
    removeEntityFilter,
    resetEntityFilters,
    applyEntityFilters,
    clearFilters,
    toggleDetails,
    handleSaveSearch,
    triggerSearch,
  };
}

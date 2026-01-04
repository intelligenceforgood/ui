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
import type {
  HybridSearchSchema,
  SavedSearchDescriptor,
} from "@/types/reviews";
import { deriveTimeRangeFromPreset } from "@/lib/search/filters";
import { buildSearchHref } from "@/lib/search-links";
import { TextWithTokens } from "@/components/text-with-tokens";
import {
  ArrowUpRight,
  BookmarkPlus,
  Filter,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  ScamIntentDescriptions,
  DeliveryChannelDescriptions,
  SocialEngineeringTechniqueDescriptions,
  RequestedActionDescriptions,
  ClaimedPersonaDescriptions,
} from "../../../../../../types/taxonomy";

type MatchMode = "exact" | "prefix" | "contains";

type EntityFilterRow = {
  id: string;
  type: string;
  value: string;
  matchMode: MatchMode;
};

type InitialEntityFilter = Omit<EntityFilterRow, "id"> & { id?: string };

type InitialSelection = Partial<{
  sources: string[];
  taxonomy: string[];
  indicatorTypes: string[];
  datasets: string[];
  timePreset: string | null;
  entities: InitialEntityFilter[];
}>;

type FacetSelection = {
  sources: string[];
  taxonomy: string[];
  indicatorTypes: string[];
  datasets: string[];
  timePreset: string | null;
};

type FacetField = "sources" | "taxonomy";

type SearchOverrides = Partial<{
  query: string;
  sources: string[];
  taxonomy: string[];
  indicatorTypes: string[];
  datasets: string[];
  timePreset: string | null;
  entities: EntityFilterRow[];
}>;

type BuildSearchRequestOptions = {
  includeSavedSearchContext?: boolean;
};

type SearchExperienceProps = {
  initialResults: SearchResponse;
  initialSelection?: InitialSelection;
  initialSavedSearch?: SavedSearchDescriptor | null;
  schema: HybridSearchSchema;
};

const facetFieldMap: Record<string, FacetField> = {
  source: "sources",
  taxonomy: "taxonomy",
};

// Mirrors core/src/i4g/classification/classifier.py HEURISTICS keys for cross-ui consistency.
const taxonomyPresets = [
  {
    value: "romance_scam",
    label: "Romance scam",
    description:
      "Relationship / affection grooming paired with money or asset requests.",
  },
  {
    value: "crypto_investment",
    label: "Crypto investment",
    description: "Wallet + coin mentions or high-return investment language.",
  },
  {
    value: "phishing",
    label: "Phishing",
    description:
      "Suspicious login/reset prompts, impersonation, or short-link channels.",
  },
  {
    value: "potential_crypto",
    label: "Potential crypto",
    description:
      "Wallets present but weak pattern match; queue for analyst confirmation.",
  },
] as const;

const sourceColors: Record<string, string> = {
  customs: "text-amber-600 bg-amber-50",
  intake: "text-emerald-600 bg-emerald-50",
  "open-source": "text-sky-600 bg-sky-50",
  financial: "text-purple-600 bg-purple-50",
};

const DEFAULT_ENTITY_TYPE = "bank_account";
const MATCH_MODE_OPTIONS: MatchMode[] = ["exact", "prefix", "contains"];

const generateEntityFilterId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `entity-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
};

const buildEntityFilterRows = (
  entries: InitialEntityFilter[] | undefined,
  fallbackType: string,
): EntityFilterRow[] =>
  (entries ?? []).map((filter) => ({
    id: filter.id ?? generateEntityFilterId(),
    type: filter.type || fallbackType,
    value: filter.value ?? "",
    matchMode: filter.matchMode ?? "exact",
  }));

export default function SearchExperience({
  initialResults,
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
          <aside className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <Filter className="h-3.5 w-3.5" /> Filters
              </div>
              <p className="text-[11px] text-slate-400">
                {schemaSummary.indicatorTypes} indicator types -{" "}
                {schemaSummary.datasets} datasets - {schemaSummary.timePresets}{" "}
                time presets available
              </p>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold text-slate-500">
                  Fraud patterns
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Derived from core heuristics. Apply one or combine with data
                  source filters.
                </p>
                <div className="mt-3 space-y-2">
                  {taxonomyPresets.map((preset) => {
                    const isSelected = selection.taxonomy.includes(
                      preset.value,
                    );
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => toggleFacet("taxonomy", preset.value)}
                        className={
                          "w-full rounded-xl border px-3 py-2 text-left transition " +
                          (isSelected
                            ? "border-teal-400 bg-white text-teal-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-teal-200")
                        }
                      >
                        <p className="text-sm font-semibold">{preset.label}</p>
                        <p className="text-xs text-slate-500">
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-[11px] text-slate-400">
                  Mirrors `core/src/i4g/classification/classifier.py` heuristics
                  for analyst parity.
                </p>
              </div>
              {indicatorOptions.length ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500">
                    Indicator types
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {indicatorOptions.map((indicator) => {
                      const isSelected =
                        selection.indicatorTypes.includes(indicator);
                      return (
                        <button
                          key={indicator}
                          type="button"
                          onClick={() => toggleIndicatorType(indicator)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                            isSelected
                              ? "border-teal-400 bg-teal-50 text-teal-600"
                              : "border-slate-200 bg-white text-slate-500 hover:border-teal-200 hover:text-teal-600"
                          }`}
                        >
                          {indicator}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {schema.datasets.length ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500">
                    Datasets
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {schema.datasets.map((dataset) => {
                      const isSelected = selection.datasets.includes(dataset);
                      return (
                        <button
                          key={dataset}
                          type="button"
                          onClick={() => toggleDataset(dataset)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                            isSelected
                              ? "border-teal-400 bg-teal-50 text-teal-600"
                              : "border-slate-200 bg-white text-slate-500 hover:border-teal-200 hover:text-teal-600"
                          }`}
                        >
                          {dataset}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {schema.timePresets.length ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">
                      Time range
                    </p>
                    {selection.timePreset ? (
                      <button
                        type="button"
                        className="text-[11px] text-slate-500 hover:text-teal-600"
                        onClick={() => toggleTimePreset(selection.timePreset!)}
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {schema.timePresets.map((preset) => {
                      const isSelected = selection.timePreset === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => toggleTimePreset(preset)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                            isSelected
                              ? "border-teal-400 bg-teal-50 text-teal-600"
                              : "border-slate-200 bg-white text-slate-500 hover:border-teal-200 hover:text-teal-600"
                          }`}
                        >
                          Last {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {results.facets.map((facet, facetIndex) => {
                const selectionKey = facetFieldMap[facet.field];
                if (!selectionKey) {
                  return null;
                }

                return (
                  <div
                    key={`${facet.field}-${facetIndex}`}
                    className="space-y-3"
                  >
                    <p className="text-xs font-semibold text-slate-500">
                      {facet.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {facet.options.map((option, optionIndex) => {
                        const isSelected = selection[selectionKey]?.includes(
                          option.value,
                        );
                        return (
                          <button
                            key={`${facet.field}-${option.value}-${optionIndex}`}
                            type="button"
                            onClick={() =>
                              toggleFacet(selectionKey, option.value)
                            }
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                              isSelected
                                ? "border-teal-400 bg-teal-50 text-teal-600"
                                : "border-slate-200 bg-white text-slate-500 hover:border-teal-200 hover:text-teal-600"
                            }`}
                          >
                            {option.value}
                            <span
                              aria-hidden
                              className="text-[10px] text-slate-400"
                            >
                              {option.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      Entity filters
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Match exact values or prefixes across structured stores.
                    </p>
                  </div>
                  {entityFilters.length ? (
                    <button
                      type="button"
                      className="text-[11px] text-slate-500 hover:text-rose-600"
                      onClick={resetEntityFilters}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                {entityFilters.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Add an entity filter to constrain bank accounts, wallets, or
                    other indicators.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {entityFilters.map((filter) => {
                      const exampleValues = entityExampleMap[filter.type] ?? [];
                      const placeholder = exampleValues.length
                        ? `e.g., ${exampleValues[0]}`
                        : "Value or prefix";
                      return (
                        <div
                          key={filter.id}
                          className="space-y-2 rounded-xl border border-slate-200 p-3"
                        >
                          <div className="flex flex-wrap gap-2">
                            <select
                              value={filter.type}
                              onChange={(
                                event: ChangeEvent<HTMLSelectElement>,
                              ) =>
                                updateEntityFilter(filter.id, {
                                  type: event.target.value,
                                })
                              }
                              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-teal-400 focus:outline-none"
                            >
                              {indicatorOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            <select
                              value={filter.matchMode}
                              onChange={(
                                event: ChangeEvent<HTMLSelectElement>,
                              ) =>
                                updateEntityFilter(filter.id, {
                                  matchMode: event.target.value as MatchMode,
                                })
                              }
                              className="w-32 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-teal-400 focus:outline-none"
                            >
                              {MATCH_MODE_OPTIONS.map((mode) => (
                                <option key={mode} value={mode}>
                                  {mode}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={filter.value}
                              onChange={(
                                event: ChangeEvent<HTMLInputElement>,
                              ) =>
                                updateEntityFilter(filter.id, {
                                  value: event.target.value,
                                })
                              }
                              placeholder={placeholder}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-slate-500 hover:text-rose-600"
                              onClick={() => removeEntityFilter(filter.id)}
                              aria-label="Remove entity filter"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {exampleValues.length ? (
                            <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                              <span>Examples:</span>
                              {exampleValues.map((example) => (
                                <button
                                  key={`${filter.id}-${example}`}
                                  type="button"
                                  onClick={() =>
                                    updateEntityFilter(filter.id, {
                                      value: example,
                                    })
                                  }
                                  className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500 transition hover:border-teal-200 hover:text-teal-600"
                                >
                                  {example}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addEntityFilter}
                    className="justify-center"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add entity filter
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="justify-center text-slate-500"
                    disabled={activeEntityCount === 0 || isPending}
                    onClick={applyEntityFilters}
                  >
                    Apply entity filters
                  </Button>
                </div>
              </div>
            </div>
          </aside>

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
              {results.results.map((result, index) => {
                const pillClasses =
                  sourceColors[result.source] ?? "text-slate-600 bg-slate-100";
                const occurred = new Intl.DateTimeFormat("en", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(result.occurredAt));

                return (
                  <li key={`${result.id ?? "result"}-${index}`}>
                    <Card className="group flex flex-col gap-4 p-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            <span
                              className={`rounded-full px-3 py-1 ${pillClasses}`}
                            >
                              {result.source}
                            </span>
                            <span suppressHydrationWarning>{occurred}</span>
                          </div>
                          <h3 className="mt-2 text-lg font-semibold text-slate-900">
                            <TextWithTokens text={result.title} />
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            <TextWithTokens text={result.snippet} />
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-right">
                          <Badge variant="default">
                            Score {Math.round(result.score * 100)}%
                          </Badge>
                          {typeof result.confidence === "number" ? (
                            <Badge variant="success">
                              Confidence {Math.round(result.confidence * 100)}%
                            </Badge>
                          ) : null}
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 text-xs font-semibold text-teal-600 transition hover:text-teal-700"
                            aria-expanded={expandedResultId === result.id}
                            onClick={() => toggleDetails(result.id)}
                          >
                            {expandedResultId === result.id
                              ? "Hide details"
                              : "Open details"}
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {result.classification ? (
                          <>
                            {result.classification.intent.map((item, i) => (
                              <Badge
                                key={`intent-${i}`}
                                variant="danger"
                                title={
                                  ScamIntentDescriptions[
                                    item.label as keyof typeof ScamIntentDescriptions
                                  ] ||
                                  item.explanation ||
                                  ""
                                }
                              >
                                Intent: {item.label}
                              </Badge>
                            ))}
                            {result.classification.channel.map((item, i) => (
                              <Badge
                                key={`channel-${i}`}
                                variant="info"
                                title={
                                  DeliveryChannelDescriptions[
                                    item.label as keyof typeof DeliveryChannelDescriptions
                                  ] ||
                                  item.explanation ||
                                  ""
                                }
                              >
                                Channel: {item.label}
                              </Badge>
                            ))}
                            {result.classification.techniques.map((item, i) => (
                              <Badge
                                key={`tech-${i}`}
                                variant="warning"
                                title={
                                  SocialEngineeringTechniqueDescriptions[
                                    item.label as keyof typeof SocialEngineeringTechniqueDescriptions
                                  ] ||
                                  item.explanation ||
                                  ""
                                }
                              >
                                Technique: {item.label}
                              </Badge>
                            ))}
                            {result.classification.actions.map((item, i) => (
                              <Badge
                                key={`action-${i}`}
                                variant="default"
                                title={
                                  RequestedActionDescriptions[
                                    item.label as keyof typeof RequestedActionDescriptions
                                  ] ||
                                  item.explanation ||
                                  ""
                                }
                              >
                                Action: {item.label}
                              </Badge>
                            ))}
                            {result.classification.persona.map((item, i) => (
                              <Badge
                                key={`persona-${i}`}
                                variant="default"
                                title={
                                  ClaimedPersonaDescriptions[
                                    item.label as keyof typeof ClaimedPersonaDescriptions
                                  ] ||
                                  item.explanation ||
                                  ""
                                }
                              >
                                Persona: {item.label}
                              </Badge>
                            ))}
                          </>
                        ) : (
                          result.tags.map((tag, index) => (
                            <Badge
                              key={`${result.id}-tag-${tag}-${index}`}
                              variant="default"
                            >
                              #{tag}
                            </Badge>
                          ))
                        )}
                      </div>
                      {expandedResultId === result.id ? (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
                          <p>
                            <TextWithTokens text={result.snippet} />
                          </p>
                          <dl className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                            <div className="flex flex-col">
                              <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Occurred
                              </dt>
                              <dd>
                                {new Date(result.occurredAt).toLocaleString()}
                              </dd>
                            </div>
                            <div className="flex flex-col">
                              <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Source
                              </dt>
                              <dd className="capitalize">{result.source}</dd>
                            </div>
                            {typeof result.confidence === "number" ? (
                              <div className="flex flex-col">
                                <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">
                                  Confidence
                                </dt>
                                <dd>{Math.round(result.confidence * 100)}%</dd>
                              </div>
                            ) : null}
                            <div className="flex flex-col">
                              <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Score
                              </dt>
                              <dd>{Math.round(result.score * 100)}%</dd>
                            </div>
                          </dl>
                        </div>
                      ) : null}
                    </Card>
                  </li>
                );
              })}
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

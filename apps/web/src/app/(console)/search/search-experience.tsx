"use client";

import { type ChangeEvent, useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Input } from "@i4g/ui-kit";
import type { SearchResponse } from "@i4g/sdk";
import {
  ArrowUpRight,
  BookmarkPlus,
  Filter,
  Loader2,
  RefreshCcw,
  Search,
  Sparkles,
} from "lucide-react";

type SearchExperienceProps = {
  initialResults: SearchResponse;
  initialSelection?: FacetSelection;
};

type FacetSelection = {
  sources: string[];
  taxonomy: string[];
};

type SearchOverrides = Partial<{
  query: string;
  sources: string[];
  taxonomy: string[];
}>;

const facetFieldMap: Record<string, keyof FacetSelection> = {
  source: "sources",
  taxonomy: "taxonomy",
};

// Mirrors proto/src/i4g/classification/classifier.py HEURISTICS keys for cross-ui consistency.
const taxonomyPresets = [
  {
    value: "romance_scam",
    label: "Romance scam",
    description: "Relationship / affection grooming paired with money or asset requests.",
  },
  {
    value: "crypto_investment",
    label: "Crypto investment",
    description: "Wallet + coin mentions or high-return investment language.",
  },
  {
    value: "phishing",
    label: "Phishing",
    description: "Suspicious login/reset prompts, impersonation, or short-link channels.",
  },
  {
    value: "potential_crypto",
    label: "Potential crypto",
    description: "Wallets present but weak pattern match; queue for analyst confirmation.",
  },
] as const;

const sourceColors: Record<string, string> = {
  customs: "text-amber-600 bg-amber-50",
  intake: "text-emerald-600 bg-emerald-50",
  "open-source": "text-sky-600 bg-sky-50",
  financial: "text-purple-600 bg-purple-50",
};

export default function SearchExperience({ initialResults, initialSelection }: SearchExperienceProps) {
  const [query, setQuery] = useState(initialResults.stats.query ?? "");
  const [results, setResults] = useState<SearchResponse>(initialResults);
  const [selection, setSelection] = useState<FacetSelection>(
    initialSelection ?? { sources: [], taxonomy: [] }
  );
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSavingSearch, setIsSavingSearch] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const router = useRouter();

  const triggerSearch = useCallback(
    (overrides?: SearchOverrides, appliedSelection?: FacetSelection) => {
      const effectiveSelection = appliedSelection ?? selection;
      const nextQuery = overrides?.query ?? query;
      const nextSources = overrides?.sources ?? effectiveSelection.sources;
      const nextTaxonomy = overrides?.taxonomy ?? effectiveSelection.taxonomy;

      startTransition(() => {
        setError(null);
        void fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: nextQuery,
            sources: nextSources.length ? nextSources : undefined,
            taxonomy: nextTaxonomy.length ? nextTaxonomy : undefined,
            page: 1,
            pageSize: results.stats.pageSize,
          }),
        })
          .then(async (response) => {
            if (!response.ok) {
              setError("Search failed. Please try again.");
              return;
            }

            const payload = (await response.json()) as SearchResponse;
            setResults(payload);
            setQuery(payload.stats.query);
            setExpandedResultId(null);
          })
          .catch(() => {
            setError("Search failed. Please try again.");
          });
      });
    },
    [query, results.stats.pageSize, selection]
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      triggerSearch();
    },
    [triggerSearch]
  );

  const toggleFacet = useCallback(
    (field: keyof FacetSelection, value: string) => {
      setSelection((current) => {
        const alreadySelected = current[field].includes(value);
        const nextValues = alreadySelected
          ? current[field].filter((item) => item !== value)
          : [...current[field], value];

        const nextSelection = {
          ...current,
          [field]: nextValues,
        };

        triggerSearch({ [field]: nextValues } as SearchOverrides, nextSelection);

        return nextSelection;
      });
    },
    [triggerSearch]
  );

  const clearFilters = useCallback(() => {
    const cleared = { sources: [], taxonomy: [] } satisfies FacetSelection;
    setSelection(cleared);
    triggerSearch({ sources: [], taxonomy: [] }, cleared);
  }, [triggerSearch]);

  const toggleDetails = useCallback((id: string) => {
    setExpandedResultId((current) => (current === id ? null : id));
  }, []);

  const handleSaveSearch = useCallback(() => {
    setSaveError(null);
    setSaveMessage(null);
    const trimmedQuery = query.trim();
    if (!trimmedQuery && selection.sources.length === 0 && selection.taxonomy.length === 0) {
      setSaveError("Provide a query or filters before saving.");
      return;
    }

    const suggestedName = trimmedQuery || "Untitled search";
    const name = typeof window !== "undefined" ? window.prompt("Name this search", suggestedName) : suggestedName;
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
        params: {
          query: trimmedQuery,
          sources: selection.sources,
          taxonomy: selection.taxonomy,
        },
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const details = await response.json().catch(() => ({}));
          const message = typeof details.error === "string" ? details.error : "Unable to save search";
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
  }, [query, router, selection.sources, selection.taxonomy]);

  const hasActiveFilters = useMemo(() => selection.sources.length > 0 || selection.taxonomy.length > 0, [
    selection.sources.length,
    selection.taxonomy.length,
  ]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              name="query"
              value={query}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
              placeholder="Search by entity, behaviour, or case ID"
              className="pl-9"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
            <Button type="button" variant="secondary" onClick={clearFilters} disabled={isPending}>
              <RefreshCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button type="button" variant="ghost" onClick={handleSaveSearch} disabled={isPending || isSavingSearch}>
              {isSavingSearch ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4" />}
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
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold text-slate-500">Fraud patterns</p>
                <p className="mt-1 text-xs text-slate-500">
                  Derived from proto heuristics. Apply one or combine with data source filters.
                </p>
                <div className="mt-3 space-y-2">
                  {taxonomyPresets.map((preset) => {
                    const isSelected = selection.taxonomy.includes(preset.value);
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
                        <p className="text-xs text-slate-500">{preset.description}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-[11px] text-slate-400">
                  Mirrors `proto/src/i4g/classification/classifier.py` heuristics for analyst parity.
                </p>
              </div>
              {results.facets.map((facet) => {
                const selectionKey = facetFieldMap[facet.field];
                if (!selectionKey) {
                  return null;
                }

                return (
                  <div key={facet.field} className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500">{facet.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {facet.options.map((option) => {
                        const isSelected = selection[selectionKey]?.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleFacet(selectionKey, option.value)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                            isSelected
                              ? "border-teal-400 bg-teal-50 text-teal-600"
                              : "border-slate-200 bg-white text-slate-500 hover:border-teal-200 hover:text-teal-600"
                          }`}
                        >
                          {option.value}
                          <span aria-hidden className="text-[10px] text-slate-400">
                            {option.count}
                          </span>
                        </button>
                      );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <div className="relative space-y-4" aria-busy={isPending}>
            {isPending ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/80 backdrop-blur-sm dark:bg-slate-900/60">
                <div className="flex flex-col items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-200">
                  <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                  <span>Searching across structured + semantic signals…</span>
                  <span className="text-xs font-normal text-slate-400">Large corpora can take a few seconds.</span>
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <Badge variant="info">
                {results.stats.total} results in {results.stats.took} ms
              </Badge>
              {isPending ? (
                <Badge variant="default" className="animate-pulse">
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Gathering signals…
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
              <Card className="border-teal-200 bg-teal-50 text-sm text-teal-700">{saveMessage}</Card>
            ) : null}
            {saveError ? (
              <Card className="border-amber-200 bg-amber-50 text-sm text-amber-700">{saveError}</Card>
            ) : null}

            {results.suggestions.length ? (
              <Card className="border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-500">
                <p className="font-semibold uppercase tracking-[0.2em] text-slate-400">Suggestions</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {results.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
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
              {results.results.map((result) => {
                const pillClasses = sourceColors[result.source] ?? "text-slate-600 bg-slate-100";
                const occurred = new Intl.DateTimeFormat("en", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(result.occurredAt));

                return (
                  <li key={result.id}>
                    <Card className="group flex flex-col gap-4 p-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            <span className={`rounded-full px-3 py-1 ${pillClasses}`}>{result.source}</span>
                            <span>{occurred}</span>
                          </div>
                          <h3 className="mt-2 text-lg font-semibold text-slate-900">
                            {result.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">{result.snippet}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 text-right">
                          <Badge variant="default">Score {Math.round(result.score * 100)}%</Badge>
                          {typeof result.confidence === "number" ? (
                            <Badge variant="success">Confidence {Math.round(result.confidence * 100)}%</Badge>
                          ) : null}
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 text-xs font-semibold text-teal-600 transition hover:text-teal-700"
                            aria-expanded={expandedResultId === result.id}
                            onClick={() => toggleDetails(result.id)}
                          >
                            {expandedResultId === result.id ? "Hide details" : "Open details"}
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {result.tags.map((tag) => (
                          <Badge key={tag} variant="default">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      {expandedResultId === result.id ? (
                        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
                          <p>{result.snippet}</p>
                          <dl className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                            <div className="flex flex-col">
                              <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">Occurred</dt>
                              <dd>{new Date(result.occurredAt).toLocaleString()}</dd>
                            </div>
                            <div className="flex flex-col">
                              <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">Source</dt>
                              <dd className="capitalize">{result.source}</dd>
                            </div>
                            {typeof result.confidence === "number" ? (
                              <div className="flex flex-col">
                                <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">Confidence</dt>
                                <dd>{Math.round(result.confidence * 100)}%</dd>
                              </div>
                            ) : null}
                            <div className="flex flex-col">
                              <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">Score</dt>
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
                <p>No results yet. Try broadening your query or remove filters.</p>
              </Card>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}

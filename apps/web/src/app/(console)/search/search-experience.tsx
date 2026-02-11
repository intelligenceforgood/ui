"use client";

import { Badge, Button, Card, Input } from "@i4g/ui-kit";
import {
  BookmarkPlus,
  Loader2,
  RefreshCcw,
  Search,
  Sparkles,
} from "lucide-react";

import type { SearchExperienceProps } from "./search-types";
import { SearchFilterSidebar } from "./search-filter-sidebar";
import { SearchResultCard } from "./search-result-card";
import { useSearchState } from "./use-search-state";

export default function SearchExperience({
  initialResults,
  taxonomy,
  initialSelection,
  initialSavedSearch,
  schema,
}: SearchExperienceProps) {
  const {
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
    indicatorOptions,
    entityExampleMap,
    schemaSummary,
    activeEntityCount,
    hasActiveFilters,
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
  } = useSearchState({
    initialResults,
    taxonomy,
    initialSelection,
    initialSavedSearch,
    schema,
  });

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

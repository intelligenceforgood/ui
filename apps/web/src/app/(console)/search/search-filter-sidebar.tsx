"use client";

import { type ChangeEvent, memo } from "react";
import { Button, Input } from "@i4g/ui-kit";
import type { SearchResponse, TaxonomyResponse } from "@i4g/sdk";
import type { HybridSearchSchema } from "@/types/reviews";
import { Filter, Plus, X } from "lucide-react";
import { FieldHelp } from "@/components/help";
import { getTaxonomyLabel } from "@/lib/taxonomy";

import type {
  EntityFilterRow,
  FacetField,
  FacetSelection,
  MatchMode,
} from "./search-types";
import { MATCH_MODE_OPTIONS, facetFieldMap } from "./search-types";

export type SearchFilterSidebarProps = {
  schema: HybridSearchSchema;
  selection: FacetSelection;
  entityFilters: EntityFilterRow[];
  taxonomy: TaxonomyResponse;
  schemaSummary: {
    indicatorTypes: number;
    datasets: number;
    timePresets: number;
  };
  results: SearchResponse;
  activeEntityCount: number;
  isPending: boolean;
  indicatorOptions: string[];
  entityExampleMap: Record<string, string[]>;
  toggleFacet: (field: FacetField, value: string) => void;
  toggleIndicatorType: (value: string) => void;
  toggleDataset: (value: string) => void;
  toggleTimePreset: (value: string) => void;
  addEntityFilter: () => void;
  updateEntityFilter: (id: string, patch: Partial<EntityFilterRow>) => void;
  removeEntityFilter: (id: string) => void;
  resetEntityFilters: () => void;
  applyEntityFilters: () => void;
};

export const SearchFilterSidebar = memo(function SearchFilterSidebar({
  schema,
  selection,
  entityFilters,
  taxonomy,
  schemaSummary,
  results,
  activeEntityCount,
  isPending,
  indicatorOptions,
  entityExampleMap,
  toggleFacet,
  toggleIndicatorType,
  toggleDataset,
  toggleTimePreset,
  addEntityFilter,
  updateEntityFilter,
  removeEntityFilter,
  resetEntityFilters,
  applyEntityFilters,
}: SearchFilterSidebarProps) {
  return (
    <aside className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          <Filter className="h-3.5 w-3.5" /> Filters
          <FieldHelp helpKey="search.filters" side="right" />
        </div>
        <p className="text-[11px] text-slate-400">
          {schemaSummary.indicatorTypes} indicator types -{" "}
          {schemaSummary.datasets} datasets - {schemaSummary.timePresets} time
          presets available
        </p>

        {/* Active Campaigns */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-xs font-semibold text-slate-500">
            Active Campaigns
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Filter by ongoing intelligence campaigns and taxonomy
            classifications.
          </p>
          <div className="mt-3 space-y-2">
            {schema.classifications.map((item) => {
              const value = item;
              const label = getTaxonomyLabel(taxonomy, item);
              const description = null;
              const isSelected = selection.taxonomy.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleFacet("taxonomy", value)}
                  className={
                    "w-full rounded-xl border px-3 py-2 text-left transition " +
                    (isSelected
                      ? "border-teal-400 bg-white text-teal-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-teal-200")
                  }
                >
                  <p className="text-sm font-semibold">{label}</p>
                  {description ? (
                    <p className="text-xs text-slate-500">{description}</p>
                  ) : null}
                </button>
              );
            })}
            {schema.classifications.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No active campaigns found.
              </p>
            ) : null}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Synced with core/src/i4g/services/campaigns.py
          </p>
        </div>

        {/* Indicator types */}
        {indicatorOptions.length ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              Indicator types
              <FieldHelp helpKey="search.filters.indicators" side="right" />
            </p>
            <div className="flex flex-wrap gap-2">
              {indicatorOptions.map((indicator) => {
                const isSelected = selection.indicatorTypes.includes(indicator);
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

        {/* Datasets */}
        {schema.datasets.length ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500">Datasets</p>
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

        {/* Time range */}
        {schema.timePresets.length ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">Time range</p>
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

        {/* Dynamic facets */}
        {results.facets.map((facet, facetIndex) => {
          const selectionKey = facetFieldMap[facet.field];
          if (!selectionKey) {
            return null;
          }
          return (
            <div key={`${facet.field}-${facetIndex}`} className="space-y-3">
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

        {/* Entity filters */}
        <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                Entity filters
                <FieldHelp helpKey="search.filters.entities" side="right" />
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
              Add an entity filter to constrain bank accounts, wallets, or other
              indicators.
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
                        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
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
                        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
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
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
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
  );
});

SearchFilterSidebar.displayName = "SearchFilterSidebar";

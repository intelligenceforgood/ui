"use client";

import { Button, Input } from "@i4g/ui-kit";
import { SlidersHorizontal, X } from "lucide-react";

const STATUSES = ["active", "inactive", "flagged"];

interface EntityFilterSidebarProps {
  entityTypes: string[];
  entityType: string;
  onEntityTypeChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  minCaseCount: string;
  onMinCaseCountChange: (v: string) => void;
  minLoss: string;
  onMinLossChange: (v: string) => void;
  onClear: () => void;
}

export function EntityFilterSidebar({
  entityTypes,
  entityType,
  onEntityTypeChange,
  status,
  onStatusChange,
  minCaseCount,
  onMinCaseCountChange,
  minLoss,
  onMinLossChange,
  onClear,
}: EntityFilterSidebarProps) {
  const hasFilters = !!(entityType || status || minCaseCount || minLoss);

  return (
    <aside className="hidden w-56 shrink-0 space-y-6 lg:block">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Entity type */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Entity Type
        </label>
        <div className="space-y-1">
          {entityTypes.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="entity_type"
                checked={entityType === t}
                onChange={() => onEntityTypeChange(entityType === t ? "" : t)}
                className="accent-teal-600"
              />
              <span className="text-slate-700 dark:text-slate-300">{t}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Status
        </label>
        <div className="space-y-1">
          {STATUSES.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="status"
                checked={status === s}
                onChange={() => onStatusChange(status === s ? "" : s)}
                className="accent-teal-600"
              />
              <span className="capitalize text-slate-700 dark:text-slate-300">
                {s}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Min case count */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Min Cases
        </label>
        <Input
          type="number"
          min={0}
          placeholder="0"
          value={minCaseCount}
          onChange={(e) => onMinCaseCountChange(e.target.value)}
        />
      </div>

      {/* Min loss */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Min Loss ($)
        </label>
        <Input
          type="number"
          min={0}
          placeholder="0"
          value={minLoss}
          onChange={(e) => onMinLossChange(e.target.value)}
        />
      </div>

      {hasFilters && (
        <Button variant="secondary" className="w-full" onClick={onClear}>
          Clear all filters
        </Button>
      )}
    </aside>
  );
}

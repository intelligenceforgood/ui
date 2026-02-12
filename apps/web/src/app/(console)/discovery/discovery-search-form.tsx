"use client";

import { memo } from "react";
import { Button, Card, Input, Textarea } from "@i4g/ui-kit";
import {
  AlertCircle,
  Download,
  FileJson,
  Loader2,
  RefreshCcw,
  Settings2,
  Sparkles,
} from "lucide-react";

import type { DiscoverySearchRequest } from "./discovery-types";

export type DiscoverySearchFormProps = {
  form: DiscoverySearchRequest;
  advancedOpen: boolean;
  isSearching: boolean;
  isLoadingMore: boolean;
  showRaw: boolean;
  hasResults: boolean;
  error: string | null;
  onFieldChange: (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
  onToggleAdvanced: () => void;
  onToggleRaw: () => void;
  onDownloadRaw: () => void;
};

export const DiscoverySearchForm = memo(function DiscoverySearchForm({
  form,
  advancedOpen,
  isSearching,
  isLoadingMore,
  showRaw,
  hasResults,
  error,
  onFieldChange,
  onSubmit,
  onReset,
  onToggleAdvanced,
  onToggleRaw,
  onDownloadRaw,
}: DiscoverySearchFormProps) {
  const showProgress = isSearching || isLoadingMore;

  return (
    <Card className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-teal-500" />
          Discovery Controls
        </div>
        <p className="text-base text-slate-600">
          Submit queries directly through the shared FastAPI endpoint. Provide
          optional overrides for cross-project testing.
        </p>
        {showProgress ? (
          <div className="flex items-center gap-2 rounded-full border border-teal-200 bg-white/90 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-teal-600 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isLoadingMore ? "Loading more…" : "Running search…"}
          </div>
        ) : null}
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div className="space-y-1">
            <label
              htmlFor="query"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
            >
              Discovery query
            </label>
            <Input
              id="query"
              name="query"
              placeholder="wallet address flagged withdrawal"
              value={form.query}
              onChange={onFieldChange}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="pageSize"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
            >
              Page size
            </label>
            <Input
              id="pageSize"
              name="pageSize"
              type="number"
              min={1}
              max={50}
              value={form.pageSize}
              onChange={onFieldChange}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="filterExpression"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
            >
              Filter expression
            </label>
            <Textarea
              id="filterExpression"
              name="filterExpression"
              className="min-h-[120px]"
              placeholder='tags: ANY("account-security")'
              value={form.filterExpression}
              onChange={onFieldChange}
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="boostJson"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
            >
              Boost JSON (SearchRequest.BoostSpec)
            </label>
            <Textarea
              id="boostJson"
              name="boostJson"
              className="min-h-[120px]"
              placeholder='{"conditionBoostSpecs":[{"condition":"tags:ANY(\"leo\")","boost":2}]}'
              value={form.boostJson}
              onChange={onFieldChange}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/20">
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-semibold text-slate-600 transition hover:text-teal-600"
            onClick={onToggleAdvanced}
          >
            <span className="inline-flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> Advanced overrides
            </span>
            <span className="text-xs uppercase tracking-[0.2em]">
              {advancedOpen ? "Hide" : "Show"}
            </span>
          </button>
          {advancedOpen ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="project"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                >
                  Project override
                </label>
                <Input
                  id="project"
                  name="project"
                  value={form.project}
                  onChange={onFieldChange}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="location"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                >
                  Location override
                </label>
                <Input
                  id="location"
                  name="location"
                  value={form.location}
                  onChange={onFieldChange}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="dataStoreId"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                >
                  Data store ID
                </label>
                <Input
                  id="dataStoreId"
                  name="dataStoreId"
                  value={form.dataStoreId}
                  onChange={onFieldChange}
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="servingConfigId"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                >
                  Serving config ID
                </label>
                <Input
                  id="servingConfigId"
                  name="servingConfigId"
                  value={form.servingConfigId}
                  onChange={onFieldChange}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Run search
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onReset}
            disabled={showProgress}
          >
            <RefreshCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button type="button" variant="ghost" onClick={onToggleRaw}>
            <FileJson className="h-4 w-4" />
            {showRaw ? "Hide raw JSON" : "Show raw JSON"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onDownloadRaw}
            disabled={!hasResults}
          >
            <Download className="h-4 w-4" />
            Download raw
          </Button>
        </div>
      </form>

      {error ? (
        <Card className="border-rose-200 bg-rose-50 text-base text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        </Card>
      ) : null}
    </Card>
  );
});

DiscoverySearchForm.displayName = "DiscoverySearchForm";

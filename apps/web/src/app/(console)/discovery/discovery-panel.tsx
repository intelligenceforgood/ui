"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Badge, Button, Card, Input } from "@i4g/ui-kit";
import {
  AlertCircle,
  Download,
  FileJson,
  Loader2,
  RefreshCcw,
  Settings2,
  Sparkles,
} from "lucide-react";

const textAreaClasses =
  "min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100";

const initialFormState = {
  query: "",
  pageSize: 10,
  project: "",
  location: "",
  dataStoreId: "",
  servingConfigId: "",
  filterExpression: "",
  boostJson: "",
};

export type DiscoverySearchRequest = typeof initialFormState;

type DiscoveryPanelDefaults = Partial<Pick<DiscoverySearchRequest, "project" | "location" | "dataStoreId" | "servingConfigId">>;

type DiscoveryPanelProps = {
  defaults?: DiscoveryPanelDefaults;
};

export type DiscoveryResult = {
  rank: number;
  documentId: string;
  documentName: string;
  summary?: string | null;
  label?: string | null;
  tags: string[];
  source?: string | null;
  indexType?: string | null;
  struct: Record<string, unknown>;
  rankSignals: Record<string, unknown>;
  raw: unknown;
};

export type DiscoverySearchResponse = {
  results: DiscoveryResult[];
  totalSize: number;
  nextPageToken?: string;
};

function buildPayload(form: DiscoverySearchRequest) {
  const trimmedQuery = form.query.trim();
  const payload: Record<string, unknown> = {
    query: trimmedQuery,
    pageSize: Number.isFinite(form.pageSize) ? form.pageSize : 10,
  };

  const optionalFields: Array<[keyof DiscoverySearchRequest, string]> = [
    ["project", form.project],
    ["location", form.location],
    ["dataStoreId", form.dataStoreId],
    ["servingConfigId", form.servingConfigId],
    ["filterExpression", form.filterExpression],
    ["boostJson", form.boostJson],
  ];

  optionalFields.forEach(([key, value]) => {
    const trimmed = value?.trim();
    if (trimmed) {
      payload[key] = key === "pageSize" ? Number(trimmed) : trimmed;
    }
  });

  return payload;
}

export default function DiscoveryPanel({ defaults }: DiscoveryPanelProps) {
  const baseFormState = useMemo(() => ({
    ...initialFormState,
    ...defaults,
  }), [defaults]);

  const [form, setForm] = useState<DiscoverySearchRequest>(baseFormState);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [metadata, setMetadata] = useState<{ totalSize: number; nextPageToken?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [lastPayload, setLastPayload] = useState<Record<string, unknown> | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();
  const nextPageToken = metadata?.nextPageToken;

  const handleFieldChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setForm((current) => ({
        ...current,
        [name]: name === "pageSize" ? Number(value) || 10 : value,
      }));
    },
    []
  );

  const executeSearch = useCallback(
    (payload: Record<string, unknown>, options?: { append?: boolean; cachePayload?: boolean }) => {
      setError(null);
      startTransition(() => {
        if (options?.append) {
          setIsLoadingMore(true);
        }
        fetch("/api/discovery/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
          .then(async (response) => {
            if (!response.ok) {
              const details = await response.json().catch(() => ({}));
              const message = typeof details.error === "string" ? details.error : "Discovery search failed.";
              throw new Error(message);
            }
            return (await response.json()) as DiscoverySearchResponse;
          })
          .then((data) => {
            setResults((current) => (options?.append ? [...current, ...data.results] : data.results));
            setMetadata({ totalSize: data.totalSize, nextPageToken: data.nextPageToken });
            if (options?.cachePayload) {
              const basePayload = { ...payload };
              delete basePayload.pageToken;
              setLastPayload(basePayload);
            }
          })
          .catch((fetchError: Error) => {
            setResults([]);
            setMetadata(null);
            setLastPayload(null);
            setError(fetchError.message || "Discovery search failed.");
          })
          .finally(() => {
            if (options?.append) {
              setIsLoadingMore(false);
            }
          });
      });
    },
    []
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmedQuery = form.query.trim();
      if (!trimmedQuery) {
        setError("Enter a search query to begin.");
        return;
      }

      const payload = buildPayload({ ...form, query: trimmedQuery });
      executeSearch(payload, { cachePayload: true });
    },
    [executeSearch, form]
  );

  const handleLoadMore = useCallback(() => {
    if (!nextPageToken || !lastPayload) {
      return;
    }
    const payload = { ...lastPayload, pageToken: nextPageToken };
    executeSearch(payload, { append: true });
  }, [executeSearch, lastPayload, nextPageToken]);

  useEffect(() => {
    setForm(baseFormState);
  }, [baseFormState]);

  const handleReset = useCallback(() => {
    setForm(baseFormState);
    setResults([]);
    setMetadata(null);
    setLastPayload(null);
    setError(null);
    setIsLoadingMore(false);
  }, [baseFormState]);

  const handleDownloadRaw = useCallback(() => {
    if (!results.length || typeof window === "undefined" || typeof window.URL?.createObjectURL !== "function") {
      return;
    }
    const blob = new Blob([JSON.stringify(results.map((result) => result.raw), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `discovery-results-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [results]);

  const hasResults = results.length > 0;
  const lastQuerySummary = useMemo(() => {
    if (!lastPayload) {
      return null;
    }
    const entries = Object.entries(lastPayload);
    return entries.filter(([, value]) => value !== undefined && value !== "");
  }, [lastPayload]);

  return (
    <div className="space-y-6">
      <Card className="space-y-6">
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-teal-500" />
            Discovery Engine Controls
          </div>
          <p className="text-sm text-slate-500">
            Submit queries directly through the shared FastAPI endpoint. Provide optional overrides for cross-project testing.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <div className="space-y-1">
              <label htmlFor="query" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Discovery query
              </label>
              <Input
                id="query"
                name="query"
                placeholder="wallet address flagged withdrawal"
                value={form.query}
                onChange={handleFieldChange}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="pageSize" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Page size
              </label>
              <Input
                id="pageSize"
                name="pageSize"
                type="number"
                min={1}
                max={50}
                value={form.pageSize}
                onChange={handleFieldChange}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="filterExpression" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Filter expression
              </label>
              <textarea
                id="filterExpression"
                name="filterExpression"
                className={textAreaClasses}
                placeholder='tags: ANY("account-security")'
                value={form.filterExpression}
                onChange={handleFieldChange}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="boostJson" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Boost JSON (SearchRequest.BoostSpec)
              </label>
              <textarea
                id="boostJson"
                name="boostJson"
                className={textAreaClasses}
                placeholder='{"conditionBoostSpecs":[{"condition":"tags:ANY(\"leo\")","boost":2}]}'
                value={form.boostJson}
                onChange={handleFieldChange}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/20">
            <button
              type="button"
              className="flex w-full items-center justify-between text-sm font-semibold text-slate-600 transition hover:text-teal-600"
              onClick={() => setAdvancedOpen((open) => !open)}
            >
              <span className="inline-flex items-center gap-2">
                <Settings2 className="h-4 w-4" /> Advanced overrides
              </span>
              <span className="text-xs uppercase tracking-[0.2em]">{advancedOpen ? "Hide" : "Show"}</span>
            </button>
            {advancedOpen ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="project" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Project override
                  </label>
                  <Input id="project" name="project" value={form.project} onChange={handleFieldChange} />
                </div>
                <div className="space-y-1">
                  <label htmlFor="location" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Location override
                  </label>
                  <Input id="location" name="location" value={form.location} onChange={handleFieldChange} />
                </div>
                <div className="space-y-1">
                  <label htmlFor="dataStoreId" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Data store ID
                  </label>
                  <Input id="dataStoreId" name="dataStoreId" value={form.dataStoreId} onChange={handleFieldChange} />
                </div>
                <div className="space-y-1">
                  <label htmlFor="servingConfigId" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Serving config ID
                  </label>
                  <Input id="servingConfigId" name="servingConfigId" value={form.servingConfigId} onChange={handleFieldChange} />
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Run search
            </Button>
            <Button type="button" variant="secondary" onClick={handleReset} disabled={isPending}>
              <RefreshCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowRaw((value) => !value)}>
              <FileJson className="h-4 w-4" />
              {showRaw ? "Hide raw JSON" : "Show raw JSON"}
            </Button>
            <Button type="button" variant="ghost" onClick={handleDownloadRaw} disabled={!hasResults}>
              <Download className="h-4 w-4" />
              Download raw
            </Button>
          </div>
        </form>

        {error ? (
          <Card className="border-rose-200 bg-rose-50 text-sm text-rose-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </Card>
        ) : null}
      </Card>

      {isPending ? (
        <Card className="flex items-center gap-3 border-slate-100 bg-slate-50 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
          Querying Discovery Engine…
        </Card>
      ) : null}

      {metadata && (
        <Card className="flex flex-wrap items-center gap-3 border-slate-100 bg-slate-50/70 text-sm text-slate-500">
          <Badge variant="info">{metadata.totalSize} total results</Badge>
          {nextPageToken ? <Badge variant="default">Next page token: {nextPageToken}</Badge> : null}
          {lastQuerySummary ? (
            <span className="text-xs text-slate-400">Last run: {String(lastQuerySummary[0]?.[1] ?? "")}</span>
          ) : null}
        </Card>
      )}

      {lastQuerySummary && lastQuerySummary.length > 1 ? (
        <Card className="space-y-2 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Payload</p>
          <div className="grid gap-2 md:grid-cols-2">
            {lastQuerySummary.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-slate-100 bg-white/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{key}</p>
                <p className="text-sm text-slate-700">{String(value)}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {hasResults ? (
        <div className="space-y-4">
          {results.map((result) => (
            <Card key={`${result.rank}-${result.documentId}`} className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">#{result.rank}</span>
                    {result.source ? (
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-600">
                        {result.source}
                      </span>
                    ) : null}
                    {result.indexType && result.indexType !== result.source ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">
                        {result.indexType}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    {result.summary || result.documentName}
                  </h3>
                  <p className="text-xs text-slate-500">Document: {result.documentName}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.label ? <Badge variant="info">Label: {result.label}</Badge> : null}
                  <Badge variant="default">ID {result.documentId}</Badge>
                </div>
              </div>
              {result.summary ? <p className="text-sm text-slate-600">{result.summary}</p> : null}
              {result.tags.length ? (
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  {result.tags.map((tag) => (
                    <Badge key={`${result.documentId}-${tag}`} variant="default">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {Object.keys(result.rankSignals).length ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-500">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Rank signals</p>
                  <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                    {Object.entries(result.rankSignals).slice(0, 6).map(([key, value]) => (
                      <div key={key}>
                        <dt className="font-semibold text-slate-600">{key}</dt>
                        <dd className="text-slate-500">{typeof value === "number" ? value.toFixed(4) : String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
              {Object.keys(result.struct).length ? (
                <details className="rounded-xl border border-slate-100 bg-white/60 p-4 text-xs text-slate-500">
                  <summary className="cursor-pointer font-semibold text-slate-600">Structured fields</summary>
                  <pre className="mt-3 whitespace-pre-wrap break-all text-[11px] text-slate-500">
                    {JSON.stringify(result.struct, null, 2)}
                  </pre>
                </details>
              ) : null}
              {showRaw ? (
                <details className="rounded-xl border border-slate-100 bg-white/40 p-4 text-xs text-slate-500">
                  <summary className="cursor-pointer font-semibold text-slate-600">Raw payload</summary>
                  <pre className="mt-3 whitespace-pre-wrap break-all text-[11px] text-slate-500">
                    {JSON.stringify(result.raw, null, 2)}
                  </pre>
                </details>
              ) : null}
            </Card>
          ))}
          {nextPageToken ? (
            <div className="flex justify-center pt-2">
              <Button onClick={handleLoadMore} disabled={isPending || isLoadingMore} variant="secondary">
                {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Load more results
              </Button>
            </div>
          ) : null}
        </div>
      ) : metadata && metadata.totalSize === 0 && !isPending ? (
        <Card className="border-slate-100 bg-slate-50 text-sm text-slate-500">No results returned. Try adjusting the query or filters.</Card>
      ) : null}
    </div>
  );
}

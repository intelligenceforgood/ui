"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card } from "@i4g/ui-kit";
import { Loader2, Sparkles } from "lucide-react";

import type {
  DiscoveryPanelDefaults,
  DiscoveryResult,
  DiscoverySearchRequest,
  DiscoverySearchResponse,
} from "./discovery-types";
import { buildPayload, initialFormState } from "./discovery-types";
import { DiscoverySearchForm } from "./discovery-search-form";
import { DiscoveryResultCard } from "./discovery-result-card";

type DiscoveryPanelProps = {
  defaults?: DiscoveryPanelDefaults;
};

export default function DiscoveryPanel({ defaults }: DiscoveryPanelProps) {
  const baseFormState = useMemo(
    () => ({
      ...initialFormState,
      ...defaults,
    }),
    [defaults],
  );

  const [form, setForm] = useState<DiscoverySearchRequest>(baseFormState);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [metadata, setMetadata] = useState<{
    totalSize: number;
    nextPageToken?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [lastPayload, setLastPayload] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const nextPageToken = metadata?.nextPageToken;

  /* ─── event handlers ─── */

  const handleFieldChange = useCallback(
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value } = event.target;
      setForm((current) => ({
        ...current,
        [name]: name === "pageSize" ? Number(value) || 10 : value,
      }));
    },
    [],
  );

  const executeSearch = useCallback(
    (
      payload: Record<string, unknown>,
      options?: { append?: boolean; cachePayload?: boolean },
    ) => {
      setError(null);
      if (options?.append) {
        setIsLoadingMore(true);
      } else {
        setIsSearching(true);
      }

      fetch("/api/discovery/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(async (response) => {
          if (!response.ok) {
            const details = await response.json().catch(() => ({}));
            const message =
              typeof details.error === "string"
                ? details.error
                : "Discovery search failed.";
            throw new Error(message);
          }
          return (await response.json()) as DiscoverySearchResponse;
        })
        .then((data) => {
          setResults((current) =>
            options?.append ? [...current, ...data.results] : data.results,
          );
          setMetadata({
            totalSize: data.totalSize,
            nextPageToken: data.nextPageToken,
          });
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
          } else {
            setIsSearching(false);
          }
        });
    },
    [],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSearching) {
        return;
      }
      const trimmedQuery = form.query.trim();
      if (!trimmedQuery) {
        setError("Enter a search query to begin.");
        return;
      }
      const payload = buildPayload({ ...form, query: trimmedQuery });
      executeSearch(payload, { cachePayload: true });
    },
    [executeSearch, form, isSearching],
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
    setIsSearching(false);
    setIsLoadingMore(false);
  }, [baseFormState]);

  const handleDownloadRaw = useCallback(() => {
    if (
      !results.length ||
      typeof window === "undefined" ||
      typeof window.URL?.createObjectURL !== "function"
    ) {
      return;
    }
    const blob = new Blob(
      [
        JSON.stringify(
          results.map((result) => result.raw),
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `discovery-results-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [results]);

  const handleToggleAdvanced = useCallback(() => {
    setAdvancedOpen((open) => !open);
  }, []);

  const handleToggleRaw = useCallback(() => {
    setShowRaw((value) => !value);
  }, []);

  /* ─── derived state ─── */

  const hasResults = results.length > 0;

  const lastQuerySummary = useMemo(() => {
    if (!lastPayload) {
      return null;
    }
    const entries = Object.entries(lastPayload);
    return entries.filter(([, value]) => value !== undefined && value !== "");
  }, [lastPayload]);

  /* ─── render ─── */

  return (
    <div className="space-y-6 text-base">
      <DiscoverySearchForm
        form={form}
        advancedOpen={advancedOpen}
        isSearching={isSearching}
        isLoadingMore={isLoadingMore}
        showRaw={showRaw}
        hasResults={hasResults}
        error={error}
        onFieldChange={handleFieldChange}
        onSubmit={handleSubmit}
        onReset={handleReset}
        onToggleAdvanced={handleToggleAdvanced}
        onToggleRaw={handleToggleRaw}
        onDownloadRaw={handleDownloadRaw}
      />

      {metadata && (
        <Card className="flex flex-wrap items-center gap-3 border-slate-100 bg-slate-50/70 text-base text-slate-500">
          <Badge variant="info">{metadata.totalSize} total results</Badge>
          {nextPageToken ? (
            <Badge variant="default">Next page token: {nextPageToken}</Badge>
          ) : null}
          {lastQuerySummary ? (
            <span className="text-xs text-slate-400">
              Last run: {String(lastQuerySummary[0]?.[1] ?? "")}
            </span>
          ) : null}
        </Card>
      )}

      {lastQuerySummary && lastQuerySummary.length > 1 ? (
        <Card className="space-y-2 text-sm text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Payload
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {lastQuerySummary.map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl border border-slate-100 bg-white/70 p-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {key}
                </p>
                <p className="text-sm text-slate-700">{String(value)}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {hasResults ? (
        <div className="space-y-4">
          {results.map((result) => (
            <DiscoveryResultCard
              key={`${result.rank}-${result.documentId}`}
              result={result}
              showRaw={showRaw}
            />
          ))}
          {nextPageToken ? (
            <div className="flex justify-center pt-2">
              <Button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                variant="secondary"
              >
                {isLoadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Load more results
              </Button>
            </div>
          ) : null}
        </div>
      ) : metadata && metadata.totalSize === 0 && !isSearching ? (
        <Card className="border-slate-100 bg-slate-50 text-sm text-slate-500">
          No results returned. Try adjusting the query or filters.
        </Card>
      ) : null}
    </div>
  );
}

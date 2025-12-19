"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card } from "@i4g/ui-kit";
import { Clock4, History, RefreshCcw } from "lucide-react";
import { buildSearchHref } from "@/lib/search-links";
import { normalizeTimeRange, toStringArray } from "@/lib/search/filters";
import type { SearchHistoryEvent } from "@/types/reviews";

const timeRangeFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

type HistoryFilterSummary = {
  summary: string;
  taxonomy: string[];
  datasets: string[];
  entityCount: number;
  timeRangeLabel: string | null;
};

function buildRerunParams(
  params: Record<string, unknown>,
  descriptor: SearchHistoryEvent["savedSearch"],
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...params };

  if (descriptor?.id) {
    payload["saved_search_id"] = descriptor.id;
  } else if (
    typeof payload["saved_search_id"] !== "string" &&
    typeof payload["search_id"] === "string"
  ) {
    payload["saved_search_id"] = payload["search_id"];
  }

  if (descriptor?.name) {
    payload["saved_search_name"] = descriptor.name;
  }

  if (descriptor?.owner) {
    payload["saved_search_owner"] = descriptor.owner;
  }

  if (descriptor?.tags?.length) {
    payload["saved_search_tags"] = descriptor.tags;
  }

  return payload;
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(value);
  }
  return result;
}

function formatTimeRangeLabel(
  range: { start: string; end: string } | null,
): string | null {
  if (!range) {
    return null;
  }
  try {
    const start = new Date(range.start);
    const end = new Date(range.end);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
      return `${range.start} → ${range.end}`;
    }
    return `${timeRangeFormatter.format(start)} → ${timeRangeFormatter.format(end)}`;
  } catch {
    return `${range.start} → ${range.end}`;
  }
}

function summarizeHistoryParams(
  params: Record<string, unknown> | undefined,
): HistoryFilterSummary {
  if (!params) {
    return {
      summary: "",
      taxonomy: [],
      datasets: [],
      entityCount: 0,
      timeRangeLabel: null,
    };
  }

  const taxonomy = dedupeStrings([
    ...toStringArray(params.taxonomy),
    ...toStringArray(params.classification),
    ...toStringArray(params.classifications),
  ]);
  const datasets = dedupeStrings([
    ...toStringArray(params.datasets),
    ...toStringArray(params.sources),
  ]);
  const entityEntries = Array.isArray(params.entities) ? params.entities : [];
  const entityCount = entityEntries.filter(
    (entry): entry is Record<string, unknown> =>
      Boolean(entry) &&
      typeof entry === "object" &&
      typeof (entry as Record<string, unknown>).value === "string",
  ).length;
  const timeRangeValue = normalizeTimeRange(
    (params.timeRange as Record<string, unknown>) ??
      (params.time_range as Record<string, unknown>),
  );
  const timeRangeLabel = formatTimeRangeLabel(timeRangeValue);

  const summaryParts: string[] = [];
  if (taxonomy.length) {
    summaryParts.push(`Taxonomy: ${taxonomy.slice(0, 2).join(", ")}`);
  }
  if (datasets.length) {
    summaryParts.push(`Datasets: ${datasets.slice(0, 2).join(", ")}`);
  }
  if (entityCount) {
    summaryParts.push(
      `${entityCount} entity filter${entityCount === 1 ? "" : "s"}`,
    );
  }
  if (timeRangeLabel) {
    summaryParts.push(`Time: ${timeRangeLabel}`);
  }

  return {
    summary: summaryParts.slice(0, 2).join(" · "),
    taxonomy,
    datasets,
    entityCount,
    timeRangeLabel,
  };
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

type SearchHistoryListProps = {
  events: SearchHistoryEvent[];
  pageSize?: number;
};

export function SearchHistoryList({
  events: initialEvents,
  pageSize = 6,
}: SearchHistoryListProps) {
  const [events, setEvents] = useState(initialEvents);
  const [requestedLimit, setRequestedLimit] = useState(initialEvents.length);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialEvents.length >= pageSize);

  useEffect(() => {
    setEvents(initialEvents);
    setRequestedLimit(initialEvents.length);
    setHasMore(initialEvents.length >= pageSize);
    setErrorMessage(null);
    setIsLoading(false);
  }, [initialEvents, pageSize]);

  const handleLoadMore = useCallback(async () => {
    const nextLimit = requestedLimit + pageSize;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/reviews/history?limit=${nextLimit}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as {
        events?: SearchHistoryEvent[];
        error?: string;
      } | null;
      if (!response.ok || !payload) {
        const message =
          payload && typeof payload.error === "string"
            ? payload.error
            : "Unable to load history";
        throw new Error(message);
      }
      const nextEvents = Array.isArray(payload.events) ? payload.events : [];
      setEvents(nextEvents);
      setRequestedLimit(nextEvents.length);
      setHasMore(nextEvents.length >= nextLimit);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load history";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, requestedLimit]);

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <History className="h-4 w-4 text-teal-500" />
          Recent searches
        </div>
        <Badge variant="info">{events.length} entries</Badge>
      </div>
      {events.length ? (
        <ul className="space-y-3">
          {events.map((event, index) => {
            const filters = summarizeHistoryParams(event.params);
            const paramsQuery =
              typeof event.params?.["query"] === "string"
                ? (event.params["query"] as string)
                : undefined;
            const paramsText =
              typeof event.params?.["text"] === "string"
                ? (event.params["text"] as string)
                : undefined;
            const queryCandidate = event.query ?? paramsQuery ?? paramsText;
            const titleSource =
              typeof queryCandidate === "string" && queryCandidate.trim().length
                ? queryCandidate.trim()
                : filters.summary;
            const savedSearchName = toNonEmptyString(event.savedSearch?.name);
            const rerunLabel = savedSearchName ?? titleSource ?? undefined;
            const displayTitle = rerunLabel ?? "Untitled search";
            const labelOption = rerunLabel ? { label: rerunLabel } : undefined;
            const classificationBadge =
              event.classification ?? filters.taxonomy[0];
            const rerunParams = buildRerunParams(
              event.params,
              event.savedSearch ?? null,
            );

            return (
              <li
                key={`${event.id ?? "history"}-${index}`}
                className="rounded-2xl border border-slate-100 bg-white/70 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {displayTitle}
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock4 className="h-3.5 w-3.5" />{" "}
                        {formatDate(event.createdAt)}
                      </span>
                      {" · "}
                      {event.actor}
                    </p>
                  </div>
                  <Link
                    href={buildSearchHref(rerunParams, labelOption)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-teal-600 transition hover:text-teal-700"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" /> Rerun search
                  </Link>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  {savedSearchName ? (
                    <Badge variant="info">Saved search</Badge>
                  ) : null}
                  {classificationBadge ? (
                    <Badge variant="default">Tag: {classificationBadge}</Badge>
                  ) : null}
                  {filters.datasets.slice(0, 2).map((dataset) => (
                    <Badge
                      key={`${event.id}-dataset-${dataset}`}
                      variant="default"
                    >
                      Dataset: {dataset}
                    </Badge>
                  ))}
                  {filters.entityCount ? (
                    <Badge variant="default">
                      {filters.entityCount} entity filter
                      {filters.entityCount === 1 ? "" : "s"}
                    </Badge>
                  ) : null}
                  {filters.timeRangeLabel ? (
                    <Badge variant="default">
                      Window: {filters.timeRangeLabel}
                    </Badge>
                  ) : null}
                  {event.caseId ? (
                    <Badge variant="default">Case: {event.caseId}</Badge>
                  ) : null}
                  {typeof event.resultCount === "number" ? (
                    <Badge variant="info">
                      {event.resultCount} results ·{" "}
                      {event.total ?? event.resultCount} total
                    </Badge>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-500">
          No search activity logged yet.
        </div>
      )}
      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
          {errorMessage}
        </div>
      ) : null}
      {events.length > 0 && hasMore ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? <LoaderIndicator /> : "Load more"}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

function LoaderIndicator() {
  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> Loading…
    </span>
  );
}

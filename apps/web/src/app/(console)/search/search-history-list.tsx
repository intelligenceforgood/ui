"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Badge, Button, Card } from "@i4g/ui-kit";
import { Clock4, History, RefreshCcw } from "lucide-react";
import { buildSearchHref } from "@/lib/search-links";
import type { SearchHistoryEvent } from "@/types/reviews";

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

export function SearchHistoryList({ events: initialEvents, pageSize = 6 }: SearchHistoryListProps) {
  const [events, setEvents] = useState(initialEvents);
  const [requestedLimit, setRequestedLimit] = useState(initialEvents.length);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialEvents.length >= pageSize);

  const handleLoadMore = useCallback(async () => {
    const nextLimit = requestedLimit + pageSize;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/reviews/history?limit=${nextLimit}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { events?: SearchHistoryEvent[]; error?: string }
        | null;
      if (!response.ok || !payload) {
        const message = payload && typeof payload.error === "string" ? payload.error : "Unable to load history";
        throw new Error(message);
      }
      const nextEvents = Array.isArray(payload.events) ? payload.events : [];
      setEvents(nextEvents);
      setRequestedLimit(nextEvents.length);
      setHasMore(nextEvents.length >= nextLimit);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load history";
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
          {events.map((event) => (
            <li key={event.id} className="rounded-2xl border border-slate-100 bg-white/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{event.query ?? "Untitled search"}</p>
                  <p className="text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock4 className="h-3.5 w-3.5" /> {formatDate(event.createdAt)}
                    </span>
                    {" · "}
                    {event.actor}
                  </p>
                </div>
                <Link
                  href={buildSearchHref(event.params)}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-teal-600 transition hover:text-teal-700"
                >
                  <RefreshCcw className="h-3.5 w-3.5" /> Rerun search
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {event.classification ? <Badge variant="default">Tag: {event.classification}</Badge> : null}
                {event.caseId ? <Badge variant="default">Case: {event.caseId}</Badge> : null}
                {typeof event.resultCount === "number" ? (
                  <Badge variant="info">{event.resultCount} results · {event.total ?? event.resultCount} total</Badge>
                ) : null}
              </div>
            </li>
          ))}
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
          <Button type="button" variant="secondary" onClick={handleLoadMore} disabled={isLoading}>
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

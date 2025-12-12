"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Card } from "@i4g/ui-kit";
import { Bookmark, Star, StarOff, Trash2 } from "lucide-react";
import { buildSearchHref } from "@/lib/search-links";
import { toStringArray } from "@/lib/search/filters";
import type { SavedSearchRecord } from "@/types/reviews";

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

type SavedSearchesListProps = {
  items: SavedSearchRecord[];
};

function buildSavedSearchRunParams(
  item: SavedSearchRecord,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...item.params };

  const idCandidate =
    typeof payload["saved_search_id"] === "string"
      ? (payload["saved_search_id"] as string)
      : typeof payload["savedSearchId"] === "string"
        ? (payload["savedSearchId"] as string)
        : typeof payload["search_id"] === "string"
          ? (payload["search_id"] as string)
          : item.id;
  payload["saved_search_id"] = idCandidate;

  const nameCandidate =
    typeof payload["saved_search_name"] === "string"
      ? (payload["saved_search_name"] as string)
      : typeof payload["savedSearchName"] === "string"
        ? (payload["savedSearchName"] as string)
        : item.name;
  payload["saved_search_name"] = nameCandidate;

  const ownerCandidate =
    typeof payload["saved_search_owner"] === "string"
      ? (payload["saved_search_owner"] as string)
      : typeof payload["savedSearchOwner"] === "string"
        ? (payload["savedSearchOwner"] as string)
        : item.owner ?? null;
  if (ownerCandidate) {
    payload["saved_search_owner"] = ownerCandidate;
  }

  const existingTags = toStringArray(
    (payload["saved_search_tags"] as unknown) ??
      (payload["savedSearchTags"] as unknown),
  );
  const tags = existingTags.length ? existingTags : item.tags;
  if (tags.length) {
    payload["saved_search_tags"] = tags;
  }

  return payload;
}

export function SavedSearchesList({
  items: initialItems,
}: SavedSearchesListProps) {
  const [items, setItems] = useState(initialItems);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFavoriteToggle = useCallback(
    async (record: SavedSearchRecord) => {
      setPendingId(record.id);
      setError(null);
      setFeedback(null);
      try {
        const response = await fetch(`/api/reviews/saved/${record.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ favorite: !record.favorite }),
        });
        if (!response.ok) {
          const details = await response.json().catch(() => ({}));
          const message =
            typeof details.error === "string"
              ? details.error
              : "Unable to update saved search";
          throw new Error(message);
        }
        setItems((current) =>
          current.map((item) =>
            item.id === record.id
              ? {
                  ...item,
                  favorite: !item.favorite,
                }
              : item,
          ),
        );
        setFeedback(
          !record.favorite
            ? `Marked "${record.name}" as favorite.`
            : `Removed "${record.name}" from favorites.`,
        );
        router.refresh();
      } catch (updateError) {
        const message =
          updateError instanceof Error
            ? updateError.message
            : "Unable to update saved search";
        setError(message);
      } finally {
        setPendingId(null);
      }
    },
    [router],
  );

  const handleDelete = useCallback(
    async (record: SavedSearchRecord) => {
      if (typeof window !== "undefined") {
        const confirmed = window.confirm(
          `Delete saved search "${record.name}"?`,
        );
        if (!confirmed) {
          return;
        }
      }
      setPendingId(record.id);
      setError(null);
      setFeedback(null);
      try {
        const response = await fetch(`/api/reviews/saved/${record.id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const details = await response.json().catch(() => ({}));
          const message =
            typeof details.error === "string"
              ? details.error
              : "Unable to delete saved search";
          throw new Error(message);
        }
        setItems((current) => current.filter((item) => item.id !== record.id));
        setFeedback(`Deleted "${record.name}"`);
        router.refresh();
      } catch (deleteError) {
        const message =
          deleteError instanceof Error
            ? deleteError.message
            : "Unable to delete saved search";
        setError(message);
      } finally {
        setPendingId(null);
      }
    },
    [router],
  );

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Bookmark className="h-4 w-4 text-slate-500" /> Saved searches
        </div>
        <Badge variant="default">{items.length} available</Badge>
      </div>
      {feedback ? (
        <Card className="border-teal-200 bg-teal-50 text-xs text-teal-700">
          {feedback}
        </Card>
      ) : null}
      {error ? (
        <Card className="border-rose-200 bg-rose-50 text-xs text-rose-600">
          {error}
        </Card>
      ) : null}
      {items.length ? (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-slate-100 bg-white/70 p-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.owner ?? "shared"} · {formatDate(item.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pendingId === item.id}
                    onClick={() => handleFavoriteToggle(item)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-teal-200 hover:text-teal-600 disabled:opacity-60"
                  >
                    {item.favorite ? (
                      <Star className="h-3 w-3" />
                    ) : (
                      <StarOff className="h-3 w-3" />
                    )}
                    {item.favorite ? "Unfavorite" : "Favorite"}
                  </button>
                  <button
                    type="button"
                    disabled={pendingId === item.id}
                    onClick={() => handleDelete(item)}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                  <Link
                    href={buildSearchHref(buildSavedSearchRunParams(item), {
                      label: item.name,
                    })}
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600 transition hover:text-teal-700"
                  >
                    Run search
                  </Link>
                </div>
              </div>
              {item.tags.length ? (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  {item.tags.map((tag) => (
                    <Badge key={`${item.id}-${tag}`} variant="default">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-500">
          No saved searches yet. Build a query and use the FastAPI endpoint to
          store presets.
        </div>
      )}
    </Card>
  );
}

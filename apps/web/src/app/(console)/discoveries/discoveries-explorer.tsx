"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card } from "@i4g/ui-kit";
import type {
  DiscoveryList,
  DiscoveryRow,
  EnqueueResponse,
} from "@/types/discoveries";

const LIMIT = 50;

export default function DiscoveriesExplorer() {
  const [items, setItems] = useState<DiscoveryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-row inline error messages (keyed by discoveryId)
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  // Per-row in-flight flags
  const [enqueueing, setEnqueueing] = useState<Record<string, boolean>>({});
  const [dismissing, setDismissing] = useState<Record<string, boolean>>({});
  // Per-row dismiss form visibility + reason text
  const [dismissOpen, setDismissOpen] = useState<Record<string, boolean>>({});
  const [dismissReason, setDismissReason] = useState<Record<string, string>>(
    {},
  );

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(offset),
      });
      const res = await fetch(`/api/discoveries?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DiscoveryList = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load discoveries",
      );
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const setRowError = useCallback((id: string, msg: string) => {
    setRowErrors((prev) => ({ ...prev, [id]: msg }));
  }, []);

  const clearRowError = useCallback((id: string) => {
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleEnqueue = useCallback(
    async (row: DiscoveryRow) => {
      clearRowError(row.discoveryId);
      setEnqueueing((prev) => ({ ...prev, [row.discoveryId]: true }));
      try {
        const res = await fetch(`/api/discoveries/${row.discoveryId}/enqueue`, {
          method: "POST",
        });
        if (res.ok) {
          const data: EnqueueResponse = await res.json();
          setItems((prev) =>
            prev.map((r) =>
              r.discoveryId === row.discoveryId
                ? { ...r, enqueuedScanId: data.enqueuedScanId }
                : r,
            ),
          );
        } else if (res.status === 404) {
          setRowError(
            row.discoveryId,
            "Discovery not found — refresh the list",
          );
        } else if (res.status === 409) {
          setRowError(row.discoveryId, "Already enqueued");
        } else {
          setRowError(row.discoveryId, `Enqueue failed (HTTP ${res.status})`);
        }
      } catch {
        setRowError(row.discoveryId, "Network error — could not enqueue");
      } finally {
        setEnqueueing((prev) => ({ ...prev, [row.discoveryId]: false }));
      }
    },
    [clearRowError, setRowError],
  );

  const handleDismissConfirm = useCallback(
    async (row: DiscoveryRow) => {
      clearRowError(row.discoveryId);
      setDismissing((prev) => ({ ...prev, [row.discoveryId]: true }));
      const reason = dismissReason[row.discoveryId] ?? "";
      try {
        const res = await fetch(`/api/discoveries/${row.discoveryId}/dismiss`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason || undefined }),
        });
        if (res.ok) {
          setItems((prev) =>
            prev.filter((r) => r.discoveryId !== row.discoveryId),
          );
          setTotal((prev) => prev - 1);
          setDismissOpen((prev) => {
            const next = { ...prev };
            delete next[row.discoveryId];
            return next;
          });
          setDismissReason((prev) => {
            const next = { ...prev };
            delete next[row.discoveryId];
            return next;
          });
        } else if (res.status === 404) {
          setRowError(
            row.discoveryId,
            "Discovery not found — refresh the list",
          );
        } else if (res.status === 409) {
          setRowError(row.discoveryId, "Already dismissed");
        } else if (res.status === 422) {
          setRowError(
            row.discoveryId,
            "Reason is too long (max 500 characters)",
          );
        } else {
          setRowError(row.discoveryId, `Dismiss failed (HTTP ${res.status})`);
        }
      } catch {
        setRowError(row.discoveryId, "Network error — could not dismiss");
      } finally {
        setDismissing((prev) => ({ ...prev, [row.discoveryId]: false }));
      }
    },
    [clearRowError, dismissReason, setRowError],
  );

  const start = offset + 1;
  const end = Math.min(offset + LIMIT, total);

  return (
    <div className="space-y-6">
      {loading && (
        <p
          className="text-sm text-slate-500 dark:text-slate-400"
          data-testid="loading-state"
        >
          Loading discoveries…
        </p>
      )}

      {!loading && error && (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400"
          data-testid="error-banner"
        >
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p
          className="text-sm text-slate-500 dark:text-slate-400"
          data-testid="empty-state"
        >
          No active discoveries — all caught up.
        </p>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                    <th className="px-4 py-3">Domain</th>
                    <th className="px-4 py-3">Seen</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Filter reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((row) => {
                    const isPending =
                      row.enqueuedScanId == null && row.dismissedAt == null;
                    return (
                      <tr
                        key={row.discoveryId}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        data-testid={`row-${row.discoveryId}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {row.domain}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">
                          {new Date(row.seenAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">{row.source}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {row.filterReason ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          {row.enqueuedScanId ? (
                            <Badge variant="success">
                              Enqueued {row.enqueuedScanId}
                            </Badge>
                          ) : row.dismissedAt ? (
                            <Badge>Dismissed</Badge>
                          ) : (
                            <Badge variant="default">Pending</Badge>
                          )}
                        </td>
                        <td className="space-y-2 px-4 py-3">
                          {rowErrors[row.discoveryId] && (
                            <p
                              className="text-xs text-red-600 dark:text-red-400"
                              data-testid={`row-error-${row.discoveryId}`}
                            >
                              {rowErrors[row.discoveryId]}
                            </p>
                          )}

                          {isPending && (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={!!enqueueing[row.discoveryId]}
                                onClick={() => handleEnqueue(row)}
                                data-testid={`enqueue-btn-${row.discoveryId}`}
                              >
                                {enqueueing[row.discoveryId]
                                  ? "Enqueueing…"
                                  : "Enqueue scan"}
                              </Button>

                              {!dismissOpen[row.discoveryId] && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setDismissOpen((prev) => ({
                                      ...prev,
                                      [row.discoveryId]: true,
                                    }))
                                  }
                                  data-testid={`dismiss-open-btn-${row.discoveryId}`}
                                >
                                  Dismiss
                                </Button>
                              )}

                              {dismissOpen[row.discoveryId] && (
                                <div className="flex flex-col gap-1">
                                  <input
                                    type="text"
                                    maxLength={500}
                                    placeholder="Reason (optional, ≤ 500 chars)"
                                    value={dismissReason[row.discoveryId] ?? ""}
                                    onChange={(e) =>
                                      setDismissReason((prev) => ({
                                        ...prev,
                                        [row.discoveryId]: e.target.value,
                                      }))
                                    }
                                    className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
                                    data-testid={`dismiss-reason-${row.discoveryId}`}
                                  />
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      disabled={!!dismissing[row.discoveryId]}
                                      onClick={() => handleDismissConfirm(row)}
                                      data-testid={`dismiss-confirm-btn-${row.discoveryId}`}
                                    >
                                      {dismissing[row.discoveryId]
                                        ? "Dismissing…"
                                        : "Confirm dismiss"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setDismissOpen((prev) => {
                                          const next = { ...prev };
                                          delete next[row.discoveryId];
                                          return next;
                                        });
                                        clearRowError(row.discoveryId);
                                      }}
                                      data-testid={`dismiss-cancel-btn-${row.discoveryId}`}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination footer */}
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span data-testid="pagination-summary">
              {total === 0
                ? "No results"
                : `Showing ${start}–${end} of ${total}`}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                data-testid="pagination-prev"
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={offset + LIMIT >= total}
                onClick={() => setOffset(offset + LIMIT)}
                data-testid="pagination-next"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

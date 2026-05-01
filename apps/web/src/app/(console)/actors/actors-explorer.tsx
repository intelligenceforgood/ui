"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@i4g/ui-kit";
import Link from "next/link";
import type { ActorListResponse, ThreatActorRow } from "@/types/actors";

const LIMIT = 50;

export default function ActorsExplorer() {
  const [items, setItems] = useState<ThreatActorRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [reason, setReason] = useState(""); // For PII unlock

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(offset),
      });
      if (roleFilter) params.set("role", roleFilter);
      if (campaignFilter) params.set("campaign_id", campaignFilter);
      if (reason) params.set("reason", reason);

      const res = await fetch(`/api/actors?${params}`);
      if (!res.ok) {
        if (res.status === 400 && res.statusText.includes("Reason")) {
          throw new Error("Reason code required for PII access");
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data: ActorListResponse = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load actors");
    } finally {
      setLoading(false);
    }
  }, [offset, roleFilter, campaignFilter, reason]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const start = offset + 1;
  const end = Math.min(offset + LIMIT, total);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">Role</label>
            <input
              type="text"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              placeholder="e.g. admin"
              className="rounded border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">
              Campaign ID
            </label>
            <input
              type="text"
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              placeholder="e.g. c-123"
              className="rounded border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">
              PII Access Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Required for real names"
              className="rounded border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setOffset(0);
              fetchItems();
            }}
          >
            Apply Filters
          </Button>
        </div>
      </Card>

      {loading && <p className="text-sm text-slate-500">Loading actors...</p>}
      {!loading && error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-slate-500">No actors found.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Campaign</th>
                    <th className="px-4 py-3">Real Name (PII)</th>
                    <th className="px-4 py-3">Confidence</th>
                    <th className="px-4 py-3">First Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((row) => (
                    <tr
                      key={row.actorId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        <Link href={`/actors/${row.actorId}`}>
                          {row.displayName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{row.role || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.campaignId || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {row.realName ? (
                          <span className="text-amber-600 dark:text-amber-500 font-semibold">
                            {row.realName} (Audited)
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            Redacted
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.confidence
                          ? `${(row.confidence * 100).toFixed(0)}%`
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {row.firstSeenAt
                          ? new Date(row.firstSeenAt).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
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
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={offset + LIMIT >= total}
                onClick={() => setOffset(offset + LIMIT)}
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

"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Input } from "@i4g/ui-kit";
import type { IndicatorListResponse } from "@i4g/sdk";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Send,
  Tag,
  X,
} from "lucide-react";

interface IndicatorRegistryProps {
  initialParams: Record<string, string | string[] | undefined>;
}

const TABS = [
  { key: "", label: "All" },
  { key: "bank_account", label: "Bank" },
  { key: "crypto_wallet", label: "Crypto" },
  { key: "payment", label: "Payments" },
  { key: "ip_address", label: "IP" },
  { key: "domain", label: "Domain" },
];

const PAGE_SIZE = 25;

export default function IndicatorRegistry({
  initialParams,
}: IndicatorRegistryProps) {
  const [data, setData] = useState<IndicatorListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState((initialParams.category as string) ?? "");
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchIndicators = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (tab) query.set("category", tab);
      query.set("limit", String(PAGE_SIZE));
      query.set("offset", String(offset));

      const qs = query.toString();
      const res = await fetch(`/api/intelligence/indicators?${qs}`);
      if (!res.ok) throw new Error(`Failed to load indicators: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tab, offset]);

  useEffect(() => {
    fetchIndicators();
  }, [fetchIndicators]);

  const indicators = data?.items ?? [];
  const total = data?.count ?? 0;
  const hasMore = offset + PAGE_SIZE < total;

  const filtered = searchQuery
    ? indicators.filter(
        (ind) =>
          ind.indicatorId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (ind.indicatorValue &&
            ind.indicatorValue
              .toLowerCase()
              .includes(searchQuery.toLowerCase())),
      )
    : indicators;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((i) => i.indicatorId)));
    }
  };

  return (
    <div className="space-y-4">
      {/* Segmentation tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key);
              setOffset(0);
              setSelectedIds(new Set());
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search indicators…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <Button variant="ghost" onClick={() => setSearchQuery("")}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 dark:border-teal-800 dark:bg-teal-900/30">
          <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
            {selectedIds.size} selected
          </span>
          <a
            href={`/api/exports/indicators?fmt=csv${tab ? `&category=${tab}` : ""}`}
            download
          >
            <Button variant="secondary" size="sm">
              <Download className="mr-1 h-3.5 w-3.5" />
              Export CSV
            </Button>
          </a>
          <a
            href={`/api/exports/indicators?fmt=xlsx${tab ? `&category=${tab}` : ""}`}
            download
          >
            <Button variant="secondary" size="sm">
              <Download className="mr-1 h-3.5 w-3.5" />
              Export XLSX
            </Button>
          </a>
          <a
            href={`/api/exports/indicators?fmt=stix${tab ? `&category=${tab}` : ""}`}
            download
          >
            <Button variant="secondary" size="sm">
              <Download className="mr-1 h-3.5 w-3.5" />
              STIX 2.1
            </Button>
          </a>
          <Button variant="secondary" size="sm">
            <Send className="mr-1 h-3.5 w-3.5" />
            Submit to eCrimeX
          </Button>
          <Button variant="secondary" size="sm">
            <Tag className="mr-1 h-3.5 w-3.5" />
            Tag
          </Button>
        </div>
      )}

      {/* Results summary */}
      <div className="text-sm text-slate-500 dark:text-slate-400">
        {loading
          ? "Loading…"
          : `${total} indicators — showing ${offset + 1}–${Math.min(offset + PAGE_SIZE, total)}`}
      </div>

      {/* Table */}
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    filtered.length > 0 && selectedIds.size === filtered.length
                  }
                  onChange={toggleAll}
                  className="accent-teal-600"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Value
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cases
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                First Seen
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Loss
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-slate-100" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-slate-400"
                >
                  No indicators found.
                </td>
              </tr>
            ) : (
              filtered.map((ind) => (
                <tr
                  key={ind.indicatorId}
                  className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/40"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(ind.indicatorId)}
                      onChange={() => toggleSelect(ind.indicatorId)}
                      className="accent-teal-600"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {ind.indicatorId}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{ind.category ?? "—"}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-900 dark:text-white">
                    {ind.indicatorValue ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {ind.caseCount}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {ind.firstSeenAt
                      ? new Date(ind.firstSeenAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {ind.lossSum != null
                      ? `$${ind.lossSum.toLocaleString()}`
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          disabled={offset === 0}
          onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-slate-500">
          Page {Math.floor(offset / PAGE_SIZE) + 1} of{" "}
          {Math.max(1, Math.ceil(total / PAGE_SIZE))}
        </span>
        <Button
          variant="secondary"
          disabled={!hasMore}
          onClick={() => setOffset((o) => o + PAGE_SIZE)}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

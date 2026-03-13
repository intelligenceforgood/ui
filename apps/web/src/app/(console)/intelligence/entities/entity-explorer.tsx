"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Badge, Button, Input } from "@i4g/ui-kit";
import type { EntityStats, EntityListResponse } from "@i4g/sdk";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  X,
} from "lucide-react";
import { EntityFilterSidebar } from "./entity-filter-sidebar";
import { EntityDetailPanel } from "./entity-detail-panel";

interface EntityExplorerProps {
  initialParams: Record<string, string | string[] | undefined>;
}

const PAGE_SIZE = 25;

const riskColor: Record<string, "success" | "warning" | "danger" | "default"> =
  {
    low: "success",
    medium: "warning",
    high: "danger",
    critical: "danger",
  };

export default function EntityExplorer({ initialParams }: EntityExplorerProps) {
  const [data, setData] = useState<EntityListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EntityStats | null>(null);

  // Filter state
  const [entityType, setEntityType] = useState(
    (initialParams.entity_type as string) ?? "",
  );
  const [status, setStatus] = useState((initialParams.status as string) ?? "");
  const [minCaseCount, setMinCaseCount] = useState(
    (initialParams.min_case_count as string) ?? "",
  );
  const [minLoss, setMinLoss] = useState(
    (initialParams.min_loss as string) ?? "",
  );
  const [orderBy, setOrderBy] = useState(
    (initialParams.order_by as string) ?? "case_count",
  );
  const [descending, setDescending] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (entityType) query.set("entity_type", entityType);
      if (status) query.set("status", status);
      if (minCaseCount) query.set("min_case_count", minCaseCount);
      if (minLoss) query.set("min_loss", minLoss);
      if (orderBy) query.set("order_by", orderBy);
      query.set("descending", String(descending));
      query.set("limit", String(PAGE_SIZE));
      query.set("offset", String(offset));

      const qs = query.toString();
      const res = await fetch(`/api/intelligence/entities?${qs}`);
      if (!res.ok) throw new Error(`Failed to load entities: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [entityType, status, minCaseCount, minLoss, orderBy, descending, offset]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const toggleSort = (col: string) => {
    if (orderBy === col) {
      setDescending((d) => !d);
    } else {
      setOrderBy(col);
      setDescending(true);
    }
    setOffset(0);
  };

  const clearFilters = () => {
    setEntityType("");
    setStatus("");
    setMinCaseCount("");
    setMinLoss("");
    setOffset(0);
  };

  const entities = data?.items ?? [];
  const total = data?.count ?? 0;
  const hasMore = offset + PAGE_SIZE < total;

  const filteredEntities = searchQuery
    ? entities.filter(
        (e) =>
          e.canonicalValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.entityType.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : entities;

  const SortHeader = ({
    col,
    children,
  }: {
    col: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={() => toggleSort(col)}
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="flex gap-6">
      <EntityFilterSidebar
        entityType={entityType}
        onEntityTypeChange={(v) => {
          setEntityType(v);
          setOffset(0);
        }}
        status={status}
        onStatusChange={(v) => {
          setStatus(v);
          setOffset(0);
        }}
        minCaseCount={minCaseCount}
        onMinCaseCountChange={(v) => {
          setMinCaseCount(v);
          setOffset(0);
        }}
        minLoss={minLoss}
        onMinLossChange={(v) => {
          setMinLoss(v);
          setOffset(0);
        }}
        onClear={clearFilters}
      />

      <div className="flex-1 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search entities…"
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
          <a
            href={`/api/exports/entities?fmt=csv${entityType ? `&entity_type=${entityType}` : ""}${status ? `&status=${status}` : ""}`}
            download
          >
            <Button variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </a>
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>
            {loading
              ? "Loading…"
              : `${total} entities found — showing ${offset + 1}–${Math.min(offset + PAGE_SIZE, total)}`}
          </span>
        </div>

        {/* Table */}
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 text-left">
                  <SortHeader col="entity_type">Type</SortHeader>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader col="canonical_value">Value</SortHeader>
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader col="case_count">Cases</SortHeader>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader col="first_seen">First Seen</SortHeader>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader col="last_active">Last Active</SortHeader>
                </th>
                <th className="px-4 py-3 text-right">
                  <SortHeader col="cumulative_loss">Loss</SortHeader>
                </th>
                <th className="px-4 py-3 text-center">Risk</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : filteredEntities.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    No entities found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredEntities.map((entity) => (
                  <tr
                    key={`${entity.entityType}-${entity.canonicalValue}`}
                    className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/40"
                    onClick={() => setSelected(entity)}
                  >
                    <td className="px-4 py-3">
                      <Badge variant="default">{entity.entityType}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-900 dark:text-white">
                      {entity.canonicalValue}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {entity.caseCount}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {entity.firstSeenAt
                        ? new Date(entity.firstSeenAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {entity.lastSeenAt
                        ? new Date(entity.lastSeenAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {entity.lossSum != null
                        ? `$${entity.lossSum.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entity.maxRiskScore != null ? (
                        <Badge
                          variant={
                            riskColor[
                              entity.maxRiskScore >= 80
                                ? "critical"
                                : entity.maxRiskScore >= 50
                                  ? "high"
                                  : entity.maxRiskScore >= 30
                                    ? "medium"
                                    : "low"
                            ]
                          }
                        >
                          {entity.maxRiskScore.toFixed(0)}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          entity.status === "active" ? "success" : "default"
                        }
                      >
                        {entity.status ?? "—"}
                      </Badge>
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

      {/* Detail slide-over */}
      {selected && (
        <EntityDetailPanel
          entity={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

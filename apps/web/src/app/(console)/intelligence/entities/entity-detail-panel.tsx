"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card } from "@i4g/ui-kit";
import type { EntityStats, EntityCaseSummary } from "@i4g/sdk";
import {
  X,
  Activity,
  Network,
  Download,
  Flag,
  Eye,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { AnnotationPanel } from "../components/annotation-panel";
import { EntityStatusBadge } from "../components/entity-status-badge";
import { entityTypeLabel } from "@/lib/entity-types";
import { formatEntityValue } from "@/lib/entity-format";

interface EntityDetailPanelProps {
  entity: EntityStats;
  onClose: () => void;
}

interface ActivityPoint {
  week: string;
  caseCount: number;
}

interface NeighborNode {
  id: string;
  label: string;
  entityType: string;
  caseCount: number;
}

export function EntityDetailPanel({ entity, onClose }: EntityDetailPanelProps) {
  const [activity, setActivity] = useState<ActivityPoint[]>([]);
  const [neighbors, setNeighbors] = useState<NeighborNode[]>([]);
  const [linkedCases, setLinkedCases] = useState<EntityCaseSummary[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingNeighbors, setLoadingNeighbors] = useState(true);
  const [loadingCases, setLoadingCases] = useState(true);

  const fetchActivity = useCallback(async () => {
    setLoadingActivity(true);
    try {
      const et = encodeURIComponent(entity.entityType);
      const cv = encodeURIComponent(entity.canonicalValue);
      const res = await fetch(
        `/api/intelligence/entities/${et}/${cv}/activity`,
      );
      if (res.ok) {
        setActivity(await res.json());
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingActivity(false);
    }
  }, [entity.entityType, entity.canonicalValue]);

  const fetchNeighbors = useCallback(async () => {
    setLoadingNeighbors(true);
    try {
      const et = encodeURIComponent(entity.entityType);
      const cv = encodeURIComponent(entity.canonicalValue);
      const res = await fetch(
        `/api/intelligence/entities/${et}/${cv}/neighbors`,
      );
      if (res.ok) {
        const data = await res.json();
        setNeighbors(data.nodes ?? data ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingNeighbors(false);
    }
  }, [entity.entityType, entity.canonicalValue]);

  const fetchCases = useCallback(async () => {
    setLoadingCases(true);
    try {
      const et = encodeURIComponent(entity.entityType);
      const cv = encodeURIComponent(entity.canonicalValue);
      const res = await fetch(
        `/api/intelligence/entities/${et}/${cv}/cases?limit=10`,
      );
      if (res.ok) {
        const data = await res.json();
        setLinkedCases(data.items ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingCases(false);
    }
  }, [entity.entityType, entity.canonicalValue]);

  useEffect(() => {
    fetchActivity();
    fetchNeighbors();
    fetchCases();
  }, [fetchActivity, fetchNeighbors, fetchCases]);

  const maxCount = Math.max(1, ...activity.map((a) => a.caseCount));

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[420px] overflow-y-auto border-l border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default" title={entity.entityType}>
              {entityTypeLabel(entity.entityType)}
            </Badge>
            <EntityStatusBadge status={entity.status} />
          </div>
          <h2
            className="mt-1 text-lg font-semibold text-slate-900 dark:text-white"
            title={entity.canonicalValue}
          >
            {formatEntityValue(entity.entityType, entity.canonicalValue)}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6 px-6 py-6">
        {/* Impact summary */}
        <section className="grid grid-cols-2 gap-3">
          <Card className="space-y-1 p-3">
            <span className="text-xs text-slate-500">Cases</span>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">
              {entity.caseCount}
            </p>
          </Card>
          <Card className="space-y-1 p-3">
            <span className="text-xs text-slate-500">Cumulative Loss</span>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">
              {entity.lossSum != null
                ? `$${entity.lossSum.toLocaleString()}`
                : "—"}
            </p>
          </Card>
          <Card className="space-y-1 p-3">
            <span className="text-xs text-slate-500">First Seen</span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {entity.firstSeenAt
                ? new Date(entity.firstSeenAt).toLocaleDateString()
                : "—"}
            </p>
          </Card>
          <Card className="space-y-1 p-3">
            <span className="text-xs text-slate-500">Last Active</span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {entity.lastSeenAt
                ? new Date(entity.lastSeenAt).toLocaleDateString()
                : "—"}
            </p>
          </Card>
        </section>

        {/* Activity sparkline */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Activity className="h-4 w-4" />
            Activity Over Time
          </div>
          {loadingActivity ? (
            <div className="h-20 animate-pulse rounded bg-slate-100" />
          ) : activity.length === 0 ? (
            <p className="text-xs text-slate-400">No activity data</p>
          ) : (
            <div className="flex items-end gap-[2px] h-20">
              {activity.map((a) => (
                <div
                  key={a.week}
                  className="flex-1 rounded-t bg-teal-500"
                  style={{
                    height: `${(a.caseCount / maxCount) * 100}%`,
                    minHeight: a.caseCount > 0 ? "4px" : "0px",
                  }}
                  title={`${a.week}: ${a.caseCount} cases`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Mini network graph (neighbor list) */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Network className="h-4 w-4" />
            Related Entities
          </div>
          {loadingNeighbors ? (
            <div className="h-24 animate-pulse rounded bg-slate-100" />
          ) : neighbors.length === 0 ? (
            <p className="text-xs text-slate-400">
              No co-occurring entities found
            </p>
          ) : (
            <div className="space-y-1.5">
              {neighbors.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="default"
                      className="text-[10px]"
                      title={n.entityType}
                    >
                      {entityTypeLabel(n.entityType)}
                    </Badge>
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                      {n.label}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {n.caseCount} shared
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Linked Cases */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <FileText className="h-4 w-4" />
            Linked Cases
          </div>
          {loadingCases ? (
            <div className="h-24 animate-pulse rounded bg-slate-100" />
          ) : linkedCases.length === 0 ? (
            <p className="text-xs text-slate-400">No linked cases found</p>
          ) : (
            <div className="space-y-1.5">
              {linkedCases.map((c) => (
                <Link
                  key={c.caseId}
                  href={`/cases/${c.caseId}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs text-blue-600 truncate max-w-[180px]">
                      {c.caseId.length > 20
                        ? c.caseId.slice(0, 8) + "…" + c.caseId.slice(-8)
                        : c.caseId}
                    </span>
                    {c.classification && (
                      <Badge variant="default" className="text-[10px]">
                        {c.classification}
                      </Badge>
                    )}
                  </div>
                  {c.riskScore != null && (
                    <Badge
                      variant={
                        c.riskScore >= 75
                          ? "danger"
                          : c.riskScore >= 40
                            ? "warning"
                            : "default"
                      }
                      className="text-[10px]"
                    >
                      {c.riskScore.toFixed(0)}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Campaigns */}
        {entity.campaignIds && entity.campaignIds.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              Campaigns
            </div>
            <div className="flex flex-wrap gap-1.5">
              {entity.campaignIds.map((cid) => (
                <Link
                  key={cid}
                  href={`/intelligence/campaigns/${cid}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-800 border border-purple-200 hover:border-purple-400 rounded-full px-2.5 py-0.5 bg-purple-50 hover:bg-purple-100 transition-colors"
                >
                  {cid.length > 16 ? cid.slice(0, 8) + "…" : cid}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Annotations */}
        <section>
          <AnnotationPanel
            targetType="entity"
            targetId={`${entity.entityType}:${entity.canonicalValue}`}
          />
        </section>

        {/* Actions toolbar */}
        <section className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Actions
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/intelligence/graph?seed_type=${encodeURIComponent(entity.entityType)}&seed_value=${encodeURIComponent(entity.canonicalValue)}`}
            >
              <Button variant="secondary" size="sm">
                <Network className="mr-1 h-3.5 w-3.5" />
                Explore in Graph
              </Button>
            </Link>
            <Button variant="secondary" size="sm">
              <Download className="mr-1 h-3.5 w-3.5" />
              Export Summary
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await fetch("/api/intelligence/watchlist", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    entityType: entity.entityType,
                    canonicalValue: entity.canonicalValue,
                    alertOnNewCase: true,
                    alertOnLossIncrease: false,
                  }),
                });
              }}
            >
              <Eye className="mr-1 h-3.5 w-3.5" />
              Pin to Watchlist
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await fetch("/api/intelligence/entities/status", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    entityType: entity.entityType,
                    canonicalValue: entity.canonicalValue,
                    status: "flagged",
                  }),
                });
              }}
            >
              <Flag className="mr-1 h-3.5 w-3.5" />
              Flag for Review
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

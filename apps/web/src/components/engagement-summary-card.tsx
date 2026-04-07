"use client";

import { useEffect, useState } from "react";
import { Badge, Card } from "@i4g/ui-kit";
import { useEngagement } from "@/lib/engagement-context";
import type { EngagementSummary } from "@i4g/sdk";

const statusVariant: Record<
  string,
  "success" | "default" | "warning" | "info"
> = {
  active: "success",
  draft: "default",
  completed: "info",
  archived: "warning",
};

export function EngagementSummaryCard() {
  const { engagement } = useEngagement();
  const [summary, setSummary] = useState<EngagementSummary | null>(null);

  useEffect(() => {
    if (!engagement) {
      setSummary(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/engagements/${encodeURIComponent(engagement.engagementId)}/summary`,
        );
        if (res.ok && !cancelled) {
          setSummary(await res.json());
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [engagement]);

  if (!engagement || !summary) return null;

  const daysRemaining = engagement.endsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(engagement.endsAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  const completionPct = Math.round(summary.reviewCompletionPct);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Current Engagement
        </h2>
        <Badge variant={statusVariant[engagement.status] ?? "default"}>
          {engagement.status}
        </Badge>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            {engagement.name}
          </p>
          {engagement.startsAt && engagement.endsAt && (
            <p className="mt-1 text-xs text-slate-500">
              {new Date(engagement.startsAt).toLocaleDateString()} –{" "}
              {new Date(engagement.endsAt).toLocaleDateString()}
              {daysRemaining !== null && (
                <span className="ml-2 font-medium text-slate-700 dark:text-slate-300">
                  ({daysRemaining} day{daysRemaining !== 1 ? "s" : ""}{" "}
                  remaining)
                </span>
              )}
            </p>
          )}
        </div>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
              {summary.caseCount}
            </p>
            <p className="text-xs text-slate-500">Total Cases</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-teal-600">
              {summary.casesReviewed}
            </p>
            <p className="text-xs text-slate-500">Reviewed</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-amber-600">
              {summary.casesRemaining}
            </p>
            <p className="text-xs text-slate-500">Remaining</p>
          </div>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-slate-500">Review Progress</p>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {completionPct}%
          </p>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-2 rounded-full bg-teal-500 transition-all"
            style={{ width: `${Math.min(100, completionPct)}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

"use client";

import type { EngagementExtendedSummary } from "@i4g/sdk";
import { Card } from "@i4g/ui-kit";

interface Props {
  analytics: EngagementExtendedSummary;
}

export function EngagementAnalyticsSummary({ analytics }: Props) {
  const stats = [
    { label: "Total Cases", value: analytics.caseCount },
    { label: "Reviewed", value: analytics.casesReviewed },
    { label: "Remaining", value: analytics.casesRemaining },
    {
      label: "Completion",
      value: `${analytics.reviewCompletionPct.toFixed(1)}%`,
    },
    { label: "Analysts", value: analytics.analystCount ?? 0 },
    {
      label: "Avg Review Time",
      value: analytics.avgReviewTimeHours
        ? `${analytics.avgReviewTimeHours}h`
        : "—",
    },
    {
      label: "Days Elapsed",
      value: analytics.daysElapsed ?? "—",
    },
    {
      label: "Days Remaining",
      value: analytics.daysRemaining ?? "—",
    },
  ];

  const distribution = analytics.classificationDistribution ?? {};
  const topClassifications = analytics.topClassifications ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {s.label}
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {Object.keys(distribution).length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-300">
            Classification Distribution
          </h3>
          <div className="space-y-2">
            {topClassifications.map((cls) => {
              const count = distribution[cls] ?? 0;
              const total = analytics.caseCount || 1;
              const pct = ((count / total) * 100).toFixed(1);
              return (
                <div key={cls} className="flex items-center gap-3">
                  <span className="w-40 truncate text-sm text-slate-600 dark:text-slate-400">
                    {cls}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-16 text-right text-sm text-slate-600 dark:text-slate-400">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

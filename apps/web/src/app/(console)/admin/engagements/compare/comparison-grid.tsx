"use client";

import type { EngagementExtendedSummary } from "@i4g/sdk";
import { Badge } from "@i4g/ui-kit";

interface Props {
  engagements: EngagementExtendedSummary[];
}

export function ComparisonGrid({ engagements }: Props) {
  const metrics = [
    {
      label: "Total Cases",
      key: "caseCount" as const,
      format: (v: number) => String(v),
    },
    {
      label: "Reviews Complete",
      key: "casesReviewed" as const,
      format: (v: number) => String(v),
    },
    {
      label: "Completion %",
      key: "reviewCompletionPct" as const,
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      label: "Analysts",
      key: "analystCount" as const,
      format: (v: number | undefined) => String(v ?? 0),
    },
    {
      label: "Avg Review Time",
      key: "avgReviewTimeHours" as const,
      format: (v: number | null | undefined) =>
        v != null ? `${v.toFixed(1)}h` : "—",
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              Metric
            </th>
            {engagements.map((e) => (
              <th
                key={e.engagementId}
                className="min-w-[180px] px-4 py-3 text-center"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {e.name}
                  </p>
                  <Badge
                    variant={e.status === "active" ? "success" : "default"}
                  >
                    {e.status}
                  </Badge>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {metrics.map((m) => (
            <tr key={m.label}>
              <td className="sticky left-0 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {m.label}
              </td>
              {engagements.map((e) => {
                const val = e[m.key];
                return (
                  <td
                    key={e.engagementId}
                    className="px-4 py-3 text-center text-sm text-slate-900 dark:text-white"
                  >
                    {m.format(val as never)}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <td className="sticky left-0 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Top Classification
            </td>
            {engagements.map((e) => (
              <td
                key={e.engagementId}
                className="px-4 py-3 text-center text-sm text-slate-900 dark:text-white"
              >
                {(e.topClassifications ?? [])[0] ?? "—"}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

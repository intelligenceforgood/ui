"use client";

import type { LeaderboardEntry } from "@i4g/sdk";
import { Card } from "@i4g/ui-kit";

interface Props {
  entries: LeaderboardEntry[];
  totalAnalysts: number;
  engagementId: string;
}

export function LeaderboardTable({
  entries,
  totalAnalysts,
  engagementId,
}: Props) {
  if (entries.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">
          No analyst activity recorded yet for this engagement.
        </p>
      </Card>
    );
  }

  function handleExport(fmt: "csv" | "json") {
    const url = `/api/engagements/${encodeURIComponent(engagementId)}/export?fmt=${fmt}`;
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {totalAnalysts} analyst{totalAnalysts !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleExport("csv")}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport("json")}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Export JSON
          </button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Analyst
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Cases
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Accuracy
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Actions
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {entries.map((entry) => (
              <tr
                key={entry.analystEmail}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
              >
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span
                    className={
                      entry.rank <= 3
                        ? "font-bold text-amber-600 dark:text-amber-400"
                        : "text-slate-700 dark:text-slate-300"
                    }
                  >
                    #{entry.rank}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900 dark:text-white">
                  {entry.analystEmail}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-700 dark:text-slate-300">
                  {entry.casesReviewed}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-700 dark:text-slate-300">
                  {(entry.classificationAccuracy * 100).toFixed(1)}%
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-700 dark:text-slate-300">
                  {entry.actionsLogged}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">
                  {entry.compositeScore.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

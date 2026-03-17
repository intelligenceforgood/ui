"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { Badge } from "@i4g/ui-kit";
import type { CaseInvestigationSummary } from "@i4g/sdk";

interface InvestigationHistoryProps {
  normalizedUrl: string;
  investigations: CaseInvestigationSummary[];
}

function riskTrend(
  current: number | null | undefined,
  previous: number | null | undefined,
) {
  if (current == null || previous == null) return null;
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "equal";
}

function TrendIcon({ trend }: { trend: "up" | "down" | "equal" | null }) {
  if (!trend) return null;
  switch (trend) {
    case "up":
      return (
        <TrendingUp
          className="h-3 w-3 text-rose-500"
          aria-label="Risk increased"
        />
      );
    case "down":
      return (
        <TrendingDown
          className="h-3 w-3 text-emerald-500"
          aria-label="Risk decreased"
        />
      );
    case "equal":
      return (
        <Minus className="h-3 w-3 text-slate-400" aria-label="Risk unchanged" />
      );
  }
}

/**
 * Timeline view of all investigations for the same normalized URL.
 * Shows latest result prominently; older results in an expandable list.
 */
export function InvestigationHistory({
  normalizedUrl,
  investigations,
}: InvestigationHistoryProps) {
  const [expanded, setExpanded] = useState(false);

  if (investigations.length === 0) return null;

  // Sort by completedAt descending (latest first)
  const sorted = [...investigations].sort((a, b) => {
    const aDate = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const bDate = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return bDate - aDate;
  });

  const latest = sorted[0];
  const history = sorted.slice(1);

  return (
    <div className="space-y-2">
      {/* Latest investigation */}
      <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
        <div>
          <p className="text-sm font-medium text-slate-700">Latest Result</p>
          {latest.completedAt && (
            <p className="text-xs text-slate-400">
              {new Date(latest.completedAt).toLocaleDateString()} •{" "}
              {latest.triggerType}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {latest.riskScore != null && (
            <Badge
              variant={
                latest.riskScore >= 75
                  ? "danger"
                  : latest.riskScore >= 40
                    ? "warning"
                    : "success"
              }
            >
              {latest.riskScore.toFixed(1)}
            </Badge>
          )}
          <Badge variant="default">{latest.status}</Badge>
        </div>
      </div>

      {/* Expandable history */}
      {history.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
            aria-expanded={expanded}
            aria-controls={`history-${normalizedUrl}`}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {history.length} previous investigation
            {history.length !== 1 ? "s" : ""}
          </button>

          {expanded && (
            <div
              id={`history-${normalizedUrl}`}
              className="mt-2 space-y-1.5 border-l-2 border-slate-200 pl-3"
            >
              {history.map((inv, idx) => {
                const next = idx < history.length - 1 ? history[idx + 1] : null;
                const trend = riskTrend(inv.riskScore, next?.riskScore);

                return (
                  <div
                    key={inv.scanId}
                    className="flex items-center justify-between py-1 text-xs"
                  >
                    <span className="text-slate-500">
                      {inv.completedAt
                        ? new Date(inv.completedAt).toLocaleDateString()
                        : "In progress"}{" "}
                      • {inv.triggerType}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <TrendIcon trend={trend} />
                      {inv.riskScore != null && (
                        <span className="font-medium text-slate-600">
                          {inv.riskScore.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

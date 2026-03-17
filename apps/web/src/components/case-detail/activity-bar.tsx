"use client";

import { clsx } from "clsx";
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import type { CaseActivity } from "@i4g/sdk";

interface ActivityBarProps {
  activities: CaseActivity[];
  hasRunning: boolean;
  onInvestigationClick?: (scanId: string) => void;
}

function activityLabel(activity: CaseActivity): string {
  switch (activity.type) {
    case "classification":
      return activity.status === "completed" ? "Classified" : "Classifying…";
    case "linkage_extraction":
      return activity.status === "completed"
        ? "Links extracted"
        : "Extracting links…";
    case "ssi_investigation": {
      const domain = activity.url ? new URL(activity.url).hostname : "URL";
      if (activity.status === "completed") return `Investigated ${domain}`;
      if (activity.status === "failed") return `Failed: ${domain}`;
      return `Investigating ${domain}…`;
    }
    default:
      return activity.type;
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
      );
    case "running":
      return (
        <Loader2
          className="h-3.5 w-3.5 animate-spin text-amber-500"
          aria-hidden="true"
        />
      );
    case "completed":
      return (
        <CheckCircle
          className="h-3.5 w-3.5 text-emerald-500"
          aria-hidden="true"
        />
      );
    case "failed":
      return (
        <XCircle className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
      );
    default:
      return null;
  }
}

const pillClasses: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  running: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700",
  failed: "bg-rose-50 text-rose-700",
};

/**
 * Horizontal bar showing running/completed background tasks as pill badges.
 * Displays at the top of the case detail page.
 */
export function ActivityBar({
  activities,
  hasRunning,
  onInvestigationClick,
}: ActivityBarProps) {
  if (activities.length === 0) return null;

  // When nothing is running, show a collapsed summary
  if (!hasRunning) {
    const completedCount = activities.filter(
      (a) => a.status === "completed",
    ).length;
    if (completedCount === activities.length) {
      return (
        <div
          className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-500"
          aria-label="All enrichment steps completed"
        >
          <CheckCircle
            className="h-4 w-4 text-emerald-500"
            aria-hidden="true"
          />
          {completedCount} enrichment step{completedCount !== 1 ? "s" : ""}{" "}
          completed
        </div>
      );
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="status"
      aria-live="polite"
      aria-label="Case background activities"
    >
      {activities.map((activity, idx) => {
        const isClickable =
          activity.type === "ssi_investigation" &&
          activity.scanId &&
          onInvestigationClick;

        const pill = (
          <span
            key={`${activity.type}-${activity.scanId ?? idx}`}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              pillClasses[activity.status] ?? pillClasses.pending,
              isClickable && "cursor-pointer hover:shadow-sm",
            )}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            aria-label={`${activity.type} status: ${activity.status}${
              activity.riskScore != null
                ? `, risk score ${activity.riskScore.toFixed(1)}`
                : ""
            }`}
            onClick={
              isClickable
                ? () => onInvestigationClick(activity.scanId!)
                : undefined
            }
            onKeyDown={
              isClickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onInvestigationClick(activity.scanId!);
                    }
                  }
                : undefined
            }
          >
            <StatusIcon status={activity.status} />
            {activityLabel(activity)}
          </span>
        );

        return pill;
      })}
    </div>
  );
}

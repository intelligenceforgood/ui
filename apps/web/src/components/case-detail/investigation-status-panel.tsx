"use client";

import {
  CheckCircle,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import type { CaseInvestigationSummary } from "@i4g/sdk";
import { Badge, Button } from "@i4g/ui-kit";

interface InvestigationStatusPanelProps {
  investigations: CaseInvestigationSummary[];
  /** All URLs extracted from case indicators (including uninvestigated). */
  caseUrls: string[];
  onInvestigate: (url: string) => void;
  onReinvestigate: (url: string, existingScanId: string) => void;
  onViewResult: (scanId: string) => void;
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function statusBadge(status: string, riskScore: number | null | undefined) {
  switch (status) {
    case "completed":
      return (
        <Badge
          variant={
            riskScore != null && riskScore >= 75
              ? "danger"
              : riskScore != null && riskScore >= 40
                ? "warning"
                : "success"
          }
        >
          <CheckCircle className="h-3 w-3" aria-hidden="true" />
          {riskScore != null ? `Risk: ${riskScore.toFixed(1)}` : "Completed"}
        </Badge>
      );
    case "running":
    case "pending":
      return (
        <Badge variant="warning">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          Investigating…
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="danger">
          <XCircle className="h-3 w-3" aria-hidden="true" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="default">{status}</Badge>;
  }
}

interface InvestigationRow {
  url: string;
  normalizedUrl: string | null;
  investigation: CaseInvestigationSummary | null;
}

function buildRows(
  investigations: CaseInvestigationSummary[],
  caseUrls: string[],
): InvestigationRow[] {
  const rows: InvestigationRow[] = [];
  const seen = new Set<string>();

  // Add investigated URLs first
  for (const inv of investigations) {
    const key = inv.normalizedUrl ?? inv.url;
    if (!seen.has(key)) {
      seen.add(key);
      rows.push({
        url: inv.url,
        normalizedUrl: inv.normalizedUrl ?? null,
        investigation: inv,
      });
    }
  }

  // Add uninvestigated URLs
  for (const url of caseUrls) {
    // Simple dedup — check if already present by raw URL match
    if (!seen.has(url)) {
      seen.add(url);
      rows.push({ url, normalizedUrl: null, investigation: null });
    }
  }

  // Sort: running first, then uninvestigated, then completed
  const order: Record<string, number> = {
    running: 0,
    pending: 0,
    uninvestigated: 1,
    failed: 2,
    completed: 3,
  };

  rows.sort((a, b) => {
    const aOrder = a.investigation
      ? order[a.investigation.status] ?? 2
      : order.uninvestigated;
    const bOrder = b.investigation
      ? order[b.investigation.status] ?? 2
      : order.uninvestigated;
    return aOrder - bOrder;
  });

  return rows;
}

/**
 * Panel showing all URLs found in a case with their investigation status.
 * Each URL gets a status badge and action buttons.
 */
export function InvestigationStatusPanel({
  investigations,
  caseUrls,
  onInvestigate,
  onReinvestigate,
  onViewResult,
}: InvestigationStatusPanelProps) {
  const rows = buildRows(investigations, caseUrls);

  if (rows.length === 0) {
    return (
      <p className="text-sm italic text-slate-500">
        No URLs found in this case.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const inv = row.investigation;
        const hostname = extractHostname(row.url);

        return (
          <div
            key={row.normalizedUrl ?? row.url}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 transition-colors hover:bg-slate-100"
          >
            {/* URL info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Globe
                  className="h-4 w-4 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <span
                  className="truncate text-sm font-medium text-slate-700"
                  title={row.url}
                >
                  {hostname}
                </span>
              </div>
              <p
                className="mt-0.5 truncate text-xs text-slate-400"
                title={row.url}
              >
                {row.url}
              </p>
              {inv?.completedAt && (
                <p className="mt-0.5 text-xs text-slate-400">
                  {new Date(inv.completedAt).toLocaleDateString()} •{" "}
                  {inv.triggerType}
                </p>
              )}
            </div>

            {/* Status + Actions */}
            <div className="flex shrink-0 items-center gap-2">
              {inv ? (
                <>
                  <span
                    aria-label={`Investigation status: ${inv.status}${
                      inv.riskScore != null
                        ? `, risk score ${inv.riskScore.toFixed(1)}`
                        : ""
                    }`}
                  >
                    {statusBadge(inv.status, inv.riskScore)}
                  </span>
                  {inv.status === "completed" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewResult(inv.scanId)}
                        aria-label={`View investigation result for ${hostname}`}
                      >
                        <ExternalLink
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReinvestigate(row.url, inv.scanId)}
                        aria-label={`Re-investigate ${hostname}`}
                      >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                        Re-investigate
                      </Button>
                    </>
                  )}
                  {inv.status === "failed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onInvestigate(row.url)}
                      aria-label={`Retry investigation for ${hostname}`}
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      Retry
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Badge variant="default">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    Not investigated
                  </Badge>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onInvestigate(row.url)}
                    aria-label={`Investigate ${hostname}`}
                  >
                    <Search className="h-3.5 w-3.5" aria-hidden="true" />
                    Investigate
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

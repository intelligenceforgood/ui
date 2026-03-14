"use client";

import Link from "next/link";
import { Badge, Card } from "@i4g/ui-kit";
import { AlertTriangle, ChevronRight } from "lucide-react";
import type { ThreatCampaign } from "@i4g/sdk";

interface CampaignAlertsProps {
  campaigns: ThreatCampaign[];
  maxItems?: number;
}

export function CampaignAlerts({
  campaigns,
  maxItems = 5,
}: CampaignAlertsProps) {
  const sorted = [...campaigns]
    .sort(
      (a, b) =>
        new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() -
        new Date(a.updatedAt ?? a.createdAt ?? 0).getTime(),
    )
    .slice(0, maxItems);

  if (sorted.length === 0) {
    return (
      <Card className="p-4 text-center text-sm text-slate-400">
        No active campaign alerts
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
        <AlertTriangle className="h-4 w-4" />
        Campaign alerts
      </h2>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {sorted.map((c) => (
          <li key={c.id}>
            <Link
              href={`/campaigns/${c.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {c.name}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {c.caseCount ?? 0} cases · {c.indicatorCount ?? 0} indicators
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <Badge
                  variant={c.status === "active" ? "danger" : "default"}
                  className="text-xs"
                >
                  {c.status}
                </Badge>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {campaigns.length > maxItems && (
        <Link
          href="/campaigns"
          className="block text-center text-xs font-medium text-sky-600 hover:text-sky-700"
        >
          View all {campaigns.length} campaigns →
        </Link>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import { Card, Badge } from "@i4g/ui-kit";
import { getI4GClient } from "@/lib/i4g-client";
import {
  ShieldAlert,
  ListChecks,
  Layers,
  TrendingUp,
  PieChart,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Intelligence Dashboard",
  description:
    "Operational intelligence overview — active threats, emerging campaigns, indicator pipeline, and loss trends.",
};

export default async function IntelligenceDashboardPage() {
  const client = getI4GClient();
  const widgets = await client.getDashboardWidgets();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Intelligence
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
          Intelligence Dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Real-time overview of active threats, emerging campaigns, indicator
          pipeline health, and cumulative loss trends.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            Active Threats
          </div>
          <p className="text-3xl font-semibold text-slate-900 dark:text-white">
            {widgets.activeThreats}
          </p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <ListChecks className="h-4 w-4 text-blue-500" />
            New Indicators
          </div>
          <p className="text-3xl font-semibold text-slate-900 dark:text-white">
            {widgets.newIndicators}
          </p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Layers className="h-4 w-4 text-violet-500" />
            Emerging Campaigns
          </div>
          <p className="text-3xl font-semibold text-slate-900 dark:text-white">
            {widgets.emergingCampaigns}
          </p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            Loss Trend
          </div>
          <p className="text-3xl font-semibold text-slate-900 dark:text-white">
            $
            {widgets.lossTrend.length > 0
              ? widgets.lossTrend[
                  widgets.lossTrend.length - 1
                ].loss.toLocaleString()
              : "0"}
          </p>
        </Card>
      </section>

      {widgets.sourceBreakdown && widgets.sourceBreakdown.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Source Breakdown
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {widgets.sourceBreakdown.map(
              (src: { source: string; count: number }) => (
                <Card key={src.source} className="flex items-center gap-3">
                  <Badge variant="default">{src.count}</Badge>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {src.source}
                  </span>
                </Card>
              ),
            )}
          </div>
        </section>
      )}
    </div>
  );
}

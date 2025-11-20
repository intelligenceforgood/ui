import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Card } from "@i4g/ui-kit";
import { getI4GClient } from "@/lib/i4g-client";
import type { AnalyticsMetric } from "@i4g/sdk";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import AnalyticsCharts from "./analytics-charts";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Monitor program impact, detection health, and pipeline throughput.",
};

const trendIconMap: Record<AnalyticsMetric["trend"], ReactNode> = {
  up: <TrendingUp className="h-4 w-4 text-emerald-500" />,
  down: <TrendingDown className="h-4 w-4 text-rose-500" />,
  flat: <Activity className="h-4 w-4 text-slate-400" />,
};

export default async function AnalyticsPage() {
  const client = getI4GClient();
  const analytics = await client.getAnalyticsOverview();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Program insights
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Analytics & impact reporting</h1>
        <p className="max-w-3xl text-sm text-slate-500">
          Track detection performance, pipeline health, and operational coverage to inform partner updates and resourcing decisions.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {analytics.metrics.map((metric) => (
          <Card key={metric.id} className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{metric.label}</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                {trendIconMap[metric.trend]}
                {metric.change}
              </span>
            </div>
            <p className="text-3xl font-semibold text-slate-900">{metric.value}</p>
          </Card>
        ))}
      </section>

      <AnalyticsCharts data={analytics} />
    </div>
  );
}

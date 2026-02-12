import type { Metadata } from "next";
import type { ReactNode } from "react";
import nextDynamic from "next/dynamic";
import { Badge, Card } from "@i4g/ui-kit";
import { getI4GClient } from "@/lib/i4g-client";
import type { AnalyticsMetric } from "@i4g/sdk";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";

const AnalyticsCharts = nextDynamic(() => import("./analytics-charts"), {
  loading: () => (
    <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
  ),
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Monitor program impact, detection health, and pipeline throughput.",
};

const trendIconMap: Record<AnalyticsMetric["trend"], ReactNode> = {
  up: <TrendingUp className="h-3 w-3" />,
  down: <TrendingDown className="h-3 w-3" />,
  flat: <Activity className="h-3 w-3" />,
};

const trendColorMap: Record<
  AnalyticsMetric["trend"],
  "success" | "danger" | "default"
> = {
  up: "success",
  down: "danger",
  flat: "default",
};

export default async function AnalyticsPage() {
  const client = getI4GClient();
  const analytics = await client.getAnalyticsOverview();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Program insights
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Analytics & impact reporting
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Track detection performance, pipeline health, and operational coverage
          to inform partner updates and resourcing decisions.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {analytics.metrics.map((metric) => (
          <Card key={metric.id} className="space-y-2">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium text-slate-500">
                {metric.label}
              </span>
              <Badge variant={trendColorMap[metric.trend]} className="gap-1">
                {trendIconMap[metric.trend]}
                {metric.change}
              </Badge>
            </div>
            <p className="text-3xl font-semibold text-slate-900">
              {metric.value}
            </p>
          </Card>
        ))}
      </section>

      <AnalyticsCharts data={analytics} />
    </div>
  );
}

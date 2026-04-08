import type { Metadata } from "next";
import type { ReactNode } from "react";
import nextDynamic from "next/dynamic";
import { Badge, Card, FeedbackButton } from "@i4g/ui-kit";
import { getI4GClient } from "@/lib/i4g-client";
import type { KpiCardItem } from "@i4g/sdk";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";

const ImpactCharts = nextDynamic(() => import("./impact-charts"), {
  loading: () => (
    <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
  ),
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Impact Analytics",
  description:
    "Monitor program impact, detection health, and pipeline throughput.",
};

function trendIcon(change: string | null | undefined): ReactNode {
  if (!change) return <Activity className="h-3 w-3" />;
  if (change.startsWith("+")) return <TrendingUp className="h-3 w-3" />;
  if (change.startsWith("-")) return <TrendingDown className="h-3 w-3" />;
  return <Activity className="h-3 w-3" />;
}

function trendColor(
  change: string | null | undefined,
): "success" | "danger" | "default" {
  if (!change) return "default";
  if (change.startsWith("+")) return "success";
  if (change.startsWith("-")) return "danger";
  return "default";
}

export default async function ImpactPage() {
  const client = await getI4GClient();
  const [dashboard, lossByTaxonomy, velocity, funnel, cumulative] =
    await Promise.all([
      client.getImpactDashboard(),
      client.getImpactLoss(),
      client.getDetectionVelocity(),
      client.getPipelineFunnel(),
      client.getCumulativeIndicators(),
    ]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-sm">
          Impact
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:mt-2 sm:text-3xl">
          Analytics & impact reporting
        </h1>
        <p className="mt-1 max-w-3xl text-xs text-slate-500 sm:mt-2 sm:text-sm">
          Track detection performance, pipeline health, and operational coverage
          to inform partner updates and resourcing decisions.
        </p>
      </header>

      <section className="group relative grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <FeedbackButton
          feedbackId="impact.metrics"
          className="absolute -top-1 right-0 z-10"
        />
        {dashboard.kpis.map((kpi: KpiCardItem) => (
          <Card key={kpi.label} className="space-y-2">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium text-slate-500">
                {kpi.label}
              </span>
              <Badge variant={trendColor(kpi.change)} className="gap-1">
                {trendIcon(kpi.change)}
                {kpi.change ?? "—"}
              </Badge>
            </div>
            <p className="text-3xl font-semibold text-slate-900">
              {kpi.value}
              {kpi.unit ? (
                <span className="ml-1 text-base text-slate-400">
                  {kpi.unit}
                </span>
              ) : null}
            </p>
          </Card>
        ))}
      </section>

      <div className="group relative">
        <ImpactCharts
          lossByTaxonomy={lossByTaxonomy}
          velocity={velocity}
          funnel={funnel}
          cumulative={cumulative}
        />
        <FeedbackButton
          feedbackId="impact.charts"
          className="absolute top-2 right-2 z-10"
        />
      </div>
    </div>
  );
}

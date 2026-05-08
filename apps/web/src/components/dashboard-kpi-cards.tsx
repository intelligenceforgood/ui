"use client";

import * as React from "react";
import { KpiCard, ProgressRing, FeedbackButton } from "@i4g/ui-kit";
import type { DashboardMetric } from "@i4g/sdk";

export function DashboardKpiCards({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <section className="group relative grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <FeedbackButton
        feedbackId="dashboard.metrics"
        className="absolute -top-1 right-0 z-10"
      />
      {metrics.map((metric) => {
        if (metric.label === "Engagement completion") {
          const pct = parseInt(metric.value.replace("%", ""), 10) || 0;
          return (
            <KpiCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              change={metric.change}
              changeType="positive"
              sparkline={
                <div className="flex h-full items-center justify-end">
                  <ProgressRing value={pct} size={40} strokeWidth={6} />
                </div>
              }
            />
          );
        }

        // For other metrics like "Campaign risk scores", etc. we can provide placeholder sparklines or just the value.
        let changeType: "neutral" | "positive" | "negative" = "neutral";
        if (metric.change.includes("+")) changeType = "positive";
        if (metric.change.includes("-")) changeType = "negative";

        return (
          <KpiCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            change={metric.change}
            changeType={changeType}
          />
        );
      })}
    </section>
  );
}

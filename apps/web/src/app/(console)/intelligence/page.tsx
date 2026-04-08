import type { Metadata } from "next";
import { Card, Badge } from "@i4g/ui-kit";
import { getI4GClient } from "@/lib/i4g-client";
import type { LeaSuggestion, WatchlistAlert } from "@i4g/sdk";
import {
  ShieldAlert,
  ListChecks,
  Layers,
  TrendingUp,
  PieChart,
  Scale,
  Bell,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Intelligence Dashboard",
  description:
    "Operational intelligence overview — active threats, emerging campaigns, indicator pipeline, and loss trends.",
};

export default async function IntelligenceDashboardPage() {
  const client = await getI4GClient();
  const watchlistAlertsPromise = client
    .getWatchlistAlerts({ unreadOnly: true, limit: 10 })
    .catch(() => [] as WatchlistAlert[]);

  const [widgets, leaResponse, watchlistAlerts] = await Promise.all([
    client.getDashboardWidgets(),
    client.getLeaSuggestions(5),
    watchlistAlertsPromise,
  ]);

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

      {watchlistAlerts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Watchlist Alerts
            </h2>
            <Badge variant="warning">{watchlistAlerts.length}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {watchlistAlerts.map((alert: WatchlistAlert) => (
              <Card
                key={alert.alertId}
                className="space-y-1 border-amber-100 dark:border-amber-900/30"
              >
                <div className="flex items-start justify-between">
                  <Badge
                    variant={
                      alert.alertType === "new_case" ? "warning" : "danger"
                    }
                  >
                    {alert.alertType === "new_case"
                      ? "New Case"
                      : "Loss Increase"}
                  </Badge>
                  <span className="text-[10px] text-slate-400">
                    {alert.createdAt
                      ? new Date(alert.createdAt).toLocaleDateString()
                      : ""}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {alert.message}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

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

      {leaResponse.suggestions.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-red-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              LEA Referral Suggestions
            </h2>
            <Badge variant="danger">{leaResponse.count}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {leaResponse.suggestions.map((suggestion: LeaSuggestion) => (
              <Card
                key={suggestion.suggestionId}
                className="space-y-2 border-red-100"
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm font-semibold text-slate-900">
                    {suggestion.targetLabel}
                  </span>
                  <Badge variant="danger">
                    Score: {suggestion.riskScore.toFixed(1)}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {suggestion.reasons.join("; ")}
                </p>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span>Loss: ${suggestion.lossSum.toLocaleString()}</span>
                  <span>Cases: {suggestion.caseCount}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import {
  getEngagementLeaderboard,
  getEngagementAnalytics,
} from "@/lib/server/engagements-service";
import { Card, SectionLabel, Badge } from "@i4g/ui-kit";
import { LeaderboardTable } from "./leaderboard-table";
import { EngagementAnalyticsSummary } from "./analytics-summary";

export const metadata: Metadata = {
  title: "Engagement Leaderboard",
  description: "View analyst rankings and engagement analytics.",
};

export const dynamic = "force-dynamic";

export default async function EngagementLeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let analytics;
  let leaderboard;
  try {
    [analytics, leaderboard] = await Promise.all([
      getEngagementAnalytics(id),
      getEngagementLeaderboard(id),
    ]);
  } catch {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <SectionLabel>Engagement</SectionLabel>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
            Leaderboard
          </h1>
        </header>
        <Card className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Unable to load engagement data. The engagement may not exist or you
            may lack permissions.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div className="space-y-2">
          <SectionLabel>Engagement</SectionLabel>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
            {analytics.name}
          </h1>
        </div>
        <Badge variant={analytics.status === "active" ? "success" : "default"}>
          {analytics.status}
        </Badge>
      </header>

      <EngagementAnalyticsSummary analytics={analytics} />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Analyst Leaderboard
        </h2>
        <LeaderboardTable
          entries={leaderboard.entries}
          totalAnalysts={leaderboard.totalAnalysts}
          engagementId={id}
        />
      </section>
    </div>
  );
}

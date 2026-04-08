import type { Metadata } from "next";
import {
  listEngagements,
  getEngagementAnalytics,
} from "@/lib/server/engagements-service";
import { Card, FeedbackButton, SectionLabel } from "@i4g/ui-kit";
import { ComparisonGrid } from "./comparison-grid";

export const metadata: Metadata = {
  title: "Engagement Comparison",
  description: "Compare engagement results across semesters.",
};

export const dynamic = "force-dynamic";

export default async function EngagementComparisonPage() {
  let engagementsList;
  try {
    engagementsList = await listEngagements();
  } catch {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <SectionLabel>Administration</SectionLabel>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
            Engagement Comparison
          </h1>
        </header>
        <Card className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Unable to load engagements.
          </p>
        </Card>
      </div>
    );
  }

  // Only compare active + completed engagements
  const comparable = engagementsList.filter(
    (e) => e.status === "active" || e.status === "completed",
  );

  // Fetch analytics for each (limit to 10 most recent)
  const analyticsResults = await Promise.allSettled(
    comparable.slice(0, 10).map((e) => getEngagementAnalytics(e.engagementId)),
  );

  const analyticsData = analyticsResults
    .filter(
      (
        r,
      ): r is PromiseFulfilledResult<
        Awaited<ReturnType<typeof getEngagementAnalytics>>
      > => r.status === "fulfilled",
    )
    .map((r) => r.value);

  return (
    <div className="group relative space-y-8">
      <FeedbackButton
        feedbackId="admin-engagements.compare"
        className="absolute top-1 right-0 z-10"
      />
      <header className="space-y-2">
        <SectionLabel>Administration</SectionLabel>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Engagement Comparison
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Side-by-side comparison of active and completed engagements.
        </p>
      </header>

      {analyticsData.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            No active or completed engagements to compare.
          </p>
        </Card>
      ) : (
        <ComparisonGrid engagements={analyticsData} />
      )}
    </div>
  );
}

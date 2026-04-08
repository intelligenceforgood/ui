import type { Metadata } from "next";
import Link from "next/link";
import { listEngagements } from "@/lib/server/engagements-service";
import { Card, SectionLabel } from "@i4g/ui-kit";
import { FeedbackButton } from "@i4g/ui-kit";
import { EngagementsTable } from "./engagements-table";

export const metadata: Metadata = {
  title: "Engagement Management",
  description: "Create and manage engagements.",
};

export const dynamic = "force-dynamic";

export default async function AdminEngagementsPage() {
  let engagements;
  try {
    engagements = await listEngagements();
  } catch {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <SectionLabel>Administration</SectionLabel>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
            Engagement Management
          </h1>
        </header>
        <Card className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Unable to load engagements. You may not have manager permissions, or
            the API may be unavailable.
          </p>
        </Card>
      </div>
    );
  }

  const active = engagements.filter(
    (e) => e.status === "active" || e.status === "draft",
  );
  const past = engagements.filter(
    (e) => e.status === "completed" || e.status === "archived",
  );

  return (
    <div className="group relative space-y-8">
      <FeedbackButton
        feedbackId="admin-engagements.page"
        className="absolute top-1 right-0 z-10"
      />
      <header className="space-y-2">
        <SectionLabel>Administration</SectionLabel>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          Engagement Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {engagements.length} engagement{engagements.length !== 1 ? "s" : ""} (
          {active.length} active, {past.length} past)
        </p>
        {past.length > 0 && (
          <Link
            href="/admin/engagements/compare"
            className="inline-block rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Compare Engagements
          </Link>
        )}
      </header>

      <EngagementsTable engagements={engagements} />
    </div>
  );
}

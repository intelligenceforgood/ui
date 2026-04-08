import type { Metadata } from "next";
import { FeedbackButton } from "@i4g/ui-kit";
import GeographyClient from "./geography-client";

export const metadata: Metadata = {
  title: "Geographic Heatmap",
  description:
    "Geographic distribution of fraud activity with country-level drill-down.",
};

export default function GeographyPage() {
  return (
    <div className="group relative space-y-8">
      <FeedbackButton
        feedbackId="impact.geography"
        className="absolute top-1 right-0 z-10"
      />
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Impact
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
          Geographic Heatmap
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Geographic distribution of fraud activity. Click a country row to view
          detailed case records.
        </p>
      </header>
      <GeographyClient />
    </div>
  );
}

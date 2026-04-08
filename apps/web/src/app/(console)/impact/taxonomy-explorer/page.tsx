import type { Metadata } from "next";
import { FeedbackButton } from "@i4g/ui-kit";
import TaxonomyExplorerClient from "./taxonomy-explorer-client";

export const metadata: Metadata = {
  title: "Taxonomy Explorer",
  description:
    "Interactive taxonomy exploration with Sankey, heatmap, and trend visualizations.",
};

export default function TaxonomyExplorerPage() {
  return (
    <div className="group relative space-y-8">
      <FeedbackButton
        feedbackId="impact.taxonomy-explorer"
        className="absolute top-1 right-0 z-10"
      />
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Impact
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
          Taxonomy Explorer
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Explore the fraud taxonomy breakdown with interactive Sankey diagrams,
          heatmaps, and trend analysis.
        </p>
      </header>
      <TaxonomyExplorerClient />
    </div>
  );
}

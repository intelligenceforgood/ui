import type { Metadata } from "next";
import TimelineClient from "./timeline-client";

export const metadata: Metadata = {
  title: "Timeline",
  description:
    "Multi-track temporal view of cases, indicators, and campaign activity.",
};

export default function TimelinePage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Intelligence
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
          Timeline
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Multi-track temporal view showing case volume, indicator activity, and
          campaign lifetimes over time.
        </p>
      </header>
      <TimelineClient />
    </div>
  );
}

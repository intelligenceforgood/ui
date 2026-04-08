import type { Metadata } from "next";
import { FeedbackButton } from "@i4g/ui-kit";
import WatchlistExplorer from "./watchlist-explorer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Watchlist",
  description:
    "Pinned entities with configurable alerts for new case activity and loss increases.",
};

export default function WatchlistPage() {
  return (
    <div className="group relative space-y-6">
      <FeedbackButton
        feedbackId="intelligence.watchlist"
        className="absolute top-1 right-0 z-10"
      />
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Intelligence
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
          Watchlist
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Pinned entities with alert conditions. Receive notifications when
          watched entities have new case activity or loss increases.
        </p>
      </header>
      <WatchlistExplorer />
    </div>
  );
}

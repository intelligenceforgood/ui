import type { Metadata } from "next";
import WatchlistExplorer from "./watchlist-explorer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Watchlist",
  description:
    "Pinned entities with configurable alerts for new case activity and loss increases.",
};

export default function WatchlistPage() {
  return (
    <div className="space-y-6">
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

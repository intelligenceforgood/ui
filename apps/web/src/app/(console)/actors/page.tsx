import type { Metadata } from "next";
import ActorsExplorer from "./actors-explorer";

export const metadata: Metadata = {
  title: "Actors",
  description: "Threat actors, their identities, and network associations.",
};

export default function ActorsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Intelligence
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
          Threat Actors
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Browse threat actor profiles, cross-campaign identities, and evidence.
        </p>
      </header>
      <ActorsExplorer />
    </div>
  );
}

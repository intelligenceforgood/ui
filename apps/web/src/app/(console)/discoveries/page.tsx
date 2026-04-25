import type { Metadata } from "next";
import DiscoveriesExplorer from "./discoveries-explorer";

export const metadata: Metadata = {
  title: "Discoveries",
  description:
    "Live feed of brand-impersonation domain candidates from merklemap and CT-log tails.",
};

export default function DiscoveriesPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Intelligence
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
          Discoveries
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Live feed of brand-impersonation domain candidates from merklemap and
          CT-log tails. Enqueue a passive scan or dismiss entries that do not
          warrant investigation.
        </p>
      </header>
      <DiscoveriesExplorer />
    </div>
  );
}

import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";
import { getDiscoveryDefaults } from "@/lib/server/discovery-config";

const DiscoveryPanel = dynamic(() => import("./discovery-panel"), {
  loading: () => (
    <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
  ),
});

export const metadata: Metadata = {
  title: "Discovery",
  description:
    "Run Google Discovery searches alongside the analyst console workflows.",
};

export default function DiscoveryPage() {
  const defaults = getDiscoveryDefaults();
  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Discovery
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
              Search the 627-case Discovery index
            </h1>
            <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
              Analysts can experiment with boost specs, filters, and override
              parameters without leaving the console. Queries route through the
              FastAPI `/discovery/search` endpoint.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
            <Sparkles className="h-4 w-4 text-teal-500" />
            Vertex AI Discovery
          </div>
        </div>
      </header>

      <DiscoveryPanel defaults={defaults} />
    </div>
  );
}

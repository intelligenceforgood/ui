import type { Metadata } from "next";
import NetworkGraphClient from "./network-graph-client";

export const metadata: Metadata = {
  title: "Network Graph",
  description:
    "Visualize entity co-occurrence relationships as an interactive force-directed graph.",
};

export default function NetworkGraphPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Intelligence
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
          Network Graph
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Explore entity co-occurrence relationships with interactive
          force-directed visualization. Click nodes to expand, drag to
          rearrange.
        </p>
      </header>
      <NetworkGraphClient />
    </div>
  );
}

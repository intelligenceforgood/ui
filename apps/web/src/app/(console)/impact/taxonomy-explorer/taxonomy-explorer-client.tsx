"use client";

import dynamic from "next/dynamic";

const TaxonomyExplorer = dynamic(() => import("./taxonomy-explorer"), {
  ssr: false,
  loading: () => (
    <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
  ),
});

export default function TaxonomyExplorerClient() {
  return <TaxonomyExplorer />;
}

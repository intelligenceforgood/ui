"use client";

import dynamic from "next/dynamic";
import type { SankeyResponse } from "@i4g/sdk";

const TaxonomyExplorer = dynamic(() => import("./taxonomy-explorer"), {
  ssr: false,
  loading: () => (
    <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
  ),
});

interface Props {
  initialSankeyData: SankeyResponse;
}

export default function TaxonomyExplorerClient({ initialSankeyData }: Props) {
  return <TaxonomyExplorer initialSankeyData={initialSankeyData} />;
}

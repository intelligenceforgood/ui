"use client";

import dynamic from "next/dynamic";
import type { GeographySummary } from "@i4g/sdk";

const GeographyView = dynamic(() => import("./geography-view"), {
  ssr: false,
  loading: () => (
    <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
  ),
});

interface Props {
  initialSummaries: GeographySummary[];
}

export default function GeographyClient({ initialSummaries }: Props) {
  return <GeographyView initialSummaries={initialSummaries} />;
}

"use client";

import dynamic from "next/dynamic";

const GeographyView = dynamic(() => import("./geography-view"), {
  ssr: false,
  loading: () => (
    <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
  ),
});

export default function GeographyClient() {
  return <GeographyView />;
}

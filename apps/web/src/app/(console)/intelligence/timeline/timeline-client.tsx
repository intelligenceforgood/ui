"use client";

import dynamic from "next/dynamic";

const TimelineView = dynamic(() => import("./timeline-view"), {
  ssr: false,
  loading: () => (
    <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
  ),
});

export default function TimelineClient() {
  return <TimelineView />;
}

"use client";

import dynamic from "next/dynamic";

const NetworkGraph = dynamic(() => import("./network-graph"), {
  ssr: false,
  loading: () => (
    <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
  ),
});

export default function NetworkGraphClient() {
  return <NetworkGraph />;
}

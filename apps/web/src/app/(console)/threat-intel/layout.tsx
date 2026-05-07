import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldAlert, Network, Users } from "lucide-react";

export default function ThreatIntelLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Intelligence
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Threat Intelligence
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Monitor and investigate active threat campaigns, actors, and
            infrastructure.
          </p>
        </div>
      </section>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <Link
            href="/threat-intel"
            className="flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent py-4 px-1 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 data-[active=true]:border-teal-500 data-[active=true]:text-teal-600"
          >
            <ShieldAlert className="h-5 w-5" />
            Overview
          </Link>
          <Link
            href="/threat-intel/actors"
            className="flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent py-4 px-1 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 data-[active=true]:border-teal-500 data-[active=true]:text-teal-600"
          >
            <Users className="h-5 w-5" />
            Threat Actors
          </Link>
          <Link
            href="/threat-intel/graph"
            className="flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent py-4 px-1 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 data-[active=true]:border-teal-500 data-[active=true]:text-teal-600"
          >
            <Network className="h-5 w-5" />
            Network Graph
          </Link>
        </nav>
      </div>

      <div>{children}</div>
    </div>
  );
}

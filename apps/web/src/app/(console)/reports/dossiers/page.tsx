import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Button, Card, Input } from "@i4g/ui-kit";
import { ArrowUpRight, Layers3 } from "lucide-react";

import { getI4GClient } from "@/lib/i4g-client";
import type { DossierListOptions } from "@i4g/sdk";
import { DossierList } from "./dossier-list";

export const metadata: Metadata = {
  title: "Evidence Dossiers",
  description:
    "Verify dossier manifests and signatures before sharing with partners.",
};

const statusOptions = ["completed", "pending", "leased", "failed", "all"];

type SearchParamsRecord = Record<string, string | string[] | undefined>;

type DossierPageProps = {
  searchParams?: Promise<SearchParamsRecord>;
};

type Filters = {
  status: string;
  limit: number;
  includeManifest: boolean;
};

function parseFilters(searchParams: SearchParamsRecord | undefined): Filters {
  const params = searchParams ?? {};
  const rawStatus =
    typeof params.status === "string" ? params.status : "completed";
  const status = statusOptions.includes(rawStatus) ? rawStatus : "completed";
  const rawLimit =
    typeof params.limit === "string" ? Number(params.limit) : Number.NaN;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 5), 200)
    : 20;
  const includeManifest =
    typeof params.manifest === "string" ? params.manifest === "1" : false;

  return { status, limit, includeManifest };
}

export default async function EvidenceDossiersPage({
  searchParams,
}: DossierPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const filters = parseFilters(resolvedParams);
  const client = getI4GClient();
  const response = await client.listDossiers({
    status: filters.status,
    limit: filters.limit,
    includeManifest: filters.includeManifest,
  } satisfies DossierListOptions);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
            Evidence readiness
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Evidence dossier verification
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-500">
            Inspect bundled cases, confirm manifest signatures, and share
            law-enforcement-ready dossiers with clear provenance. Toggle
            manifest payloads when you need the full JSON inline.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-transparent bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-2.5 text-base font-semibold text-white shadow-lg transition hover:shadow-xl dark:from-slate-200 dark:to-slate-50 dark:text-slate-900"
          >
            Launch discovery
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Button type="button" variant="secondary" className="gap-2">
            <Layers3 className="h-4 w-4" />
            Build dossier plan
          </Button>
        </div>
      </header>

      <Card className="border-0 bg-gradient-to-r from-slate-900 to-indigo-900 p-6 text-white shadow-xl dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">
              Filters
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Focus the verification pass
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Status filters limit the queue window. Pulling manifest payloads
              streams the entire JSON into the console, which is useful for LEA
              disclosures but slightly slower.
            </p>
          </div>
          <Badge
            variant="default"
            className="bg-white/10 text-white shadow-none"
          >
            {response.count} plan{response.count === 1 ? "" : "s"} loaded
          </Badge>
        </div>
        <form
          className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr]"
          method="get"
        >
          <label className="flex flex-col gap-2 text-sm font-semibold text-white">
            Queue status
            <div className="rounded-2xl bg-white/10 p-0.5">
              <select
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/90 px-4 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-300"
                name="status"
                defaultValue={filters.status}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-white">
            Rows to load
            <Input
              type="number"
              name="limit"
              min={5}
              max={200}
              defaultValue={filters.limit}
              className="h-12 rounded-2xl border-white/10 bg-white/90 font-semibold text-slate-900"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-white">
            Manifest payloads
            <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4">
              <input
                type="checkbox"
                name="manifest"
                value="1"
                defaultChecked={filters.includeManifest}
                className="h-4 w-4 rounded border-white/40 text-teal-400 focus:ring-teal-200"
              />
              <span className="text-sm font-medium text-white/90">
                Include JSON
              </span>
            </div>
          </label>
          <div className="flex flex-col gap-3 pt-6 lg:pt-0">
            <Button
              type="submit"
              className="w-full bg-white text-slate-900 hover:bg-white"
            >
              Refresh dossiers
            </Button>
            <Link
              href="/reports/dossiers"
              className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:text-white"
            >
              Reset filters
            </Link>
          </div>
        </form>
      </Card>

      <DossierList
        response={response}
        includeManifest={filters.includeManifest}
      />
    </div>
  );
}

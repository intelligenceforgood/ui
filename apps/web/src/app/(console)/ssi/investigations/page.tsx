import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, SectionLabel } from "@i4g/ui-kit";
import {
  ArrowUpRight,
  Clock,
  Globe,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import type { InvestigationsListResponse, ScanSummary } from "@/types/ssi";

export const metadata: Metadata = {
  title: "Investigations",
  description: "Browse and search past SSI investigations.",
};

export const dynamic = "force-dynamic";

const SSI_API_URL = process.env.SSI_API_URL ?? "http://localhost:8100";

const statusStyles: Record<string, string> = {
  completed:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  failed: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  running: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  pending: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  partial: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

function riskBadgeVariant(
  score: number | null | undefined,
): "danger" | "warning" | "default" {
  if (score == null) return "default";
  if (score >= 70) return "danger";
  if (score >= 40) return "warning";
  return "default";
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchInvestigations(
  params: Record<string, string>,
): Promise<InvestigationsListResponse> {
  const qs = new URLSearchParams(params).toString();
  const url = `${SSI_API_URL}/investigations${qs ? `?${qs}` : ""}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { items: [], count: 0, limit: 50, offset: 0 };
    return (await res.json()) as InvestigationsListResponse;
  } catch {
    return { items: [], count: 0, limit: 50, offset: 0 };
  }
}

function InvestigationRow({ scan }: { scan: ScanSummary }) {
  const domain = scan.domain ?? new URL(scan.url).hostname;
  return (
    <Link href={`/ssi/investigations/${scan.scan_id}`}>
      <Card className="p-4 transition hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {domain}
              </span>
              <Badge
                className={statusStyles[scan.status] ?? statusStyles.pending}
              >
                {scan.status}
              </Badge>
              {scan.scan_type && scan.scan_type !== "passive" && (
                <Badge className="bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
                  {scan.scan_type}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {scan.url}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(scan.created_at)}
              </span>
              {scan.duration_seconds != null && (
                <span>{formatDuration(scan.duration_seconds)}</span>
              )}
              {scan.classification_result?.scam_type && (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  {scan.classification_result.scam_type}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {scan.risk_score != null && (
              <Badge variant={riskBadgeVariant(scan.risk_score)}>
                {Math.round(scan.risk_score)}
              </Badge>
            )}
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default async function InvestigationsPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const status =
    typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const domain =
    typeof searchParams?.domain === "string" ? searchParams.domain : undefined;

  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (domain) params.domain = domain;

  const data = await fetchInvestigations(params);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <SectionLabel>Scam Site Investigator</SectionLabel>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
            Investigation history
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Browse all past SSI investigations, view results, and download
            evidence.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/ssi"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
          >
            <Search className="w-4 h-4" />
            New investigation
          </Link>
        </div>
      </header>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {["all", "completed", "failed", "running", "pending"].map((s) => {
          const isActive = s === "all" ? !status : status === s;
          const href =
            s === "all"
              ? "/ssi/investigations"
              : `/ssi/investigations?status=${s}`;
          return (
            <Link
              key={s}
              href={href}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {s === "completed" && <ShieldCheck className="w-3 h-3" />}
              {s === "failed" && <ShieldAlert className="w-3 h-3" />}
              <span className="capitalize">{s}</span>
            </Link>
          );
        })}
      </div>

      {/* Investigation list */}
      {data.items.length === 0 ? (
        <Card className="p-12 text-center">
          <Globe className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No investigations found.{" "}
            <Link href="/ssi" className="text-blue-600 hover:underline">
              Start one
            </Link>
            .
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.items.map((scan) => (
            <InvestigationRow key={scan.scan_id} scan={scan} />
          ))}
        </div>
      )}
    </div>
  );
}

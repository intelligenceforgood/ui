"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card } from "@i4g/ui-kit";
import type { DossierListResponse, DossierRecord, DossierVerificationReport } from "@i4g/sdk";
import {
  AlertTriangle,
  Clock3,
  DownloadCloud,
  FileWarning,
  Hash,
  Layers,
  ListChecks,
  RefreshCcw,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";

import clsx from "clsx";

type VerificationEntry = {
  status: "idle" | "loading" | "success" | "error";
  report?: DossierVerificationReport;
  error?: string;
};

type DossierListProps = {
  response: DossierListResponse;
  includeManifest: boolean;
};

const statusVariantMap: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  completed: "success",
  pending: "warning",
  leased: "info",
  failed: "danger",
};

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatCurrency(value?: unknown) {
  if (typeof value !== "number") {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizePayload(payload: DossierRecord["payload"]): Record<string, unknown> {
  if (payload && typeof payload === "object") {
    return payload as Record<string, unknown>;
  }
  return {};
}

function extractCaseIds(record: DossierRecord): string[] {
  const payload = normalizePayload(record.payload);
  const payloadCases = payload["cases"];
  if (!Array.isArray(payloadCases)) {
    return [];
  }
  return payloadCases
    .map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }
      if (entry && typeof entry === "object") {
        const data = entry as Record<string, unknown>;
        return (data.case_id as string) ?? (data.id as string) ?? "";
      }
      return "";
    })
    .filter(Boolean)
    .slice(0, 6);
}

function StatsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100/60 bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
      <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function ManifestPreview({ data }: { data: Record<string, unknown> | null }) {
  if (!data) {
    return null;
  }
  return (
    <details className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
      <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-white">Manifest JSON</summary>
      <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-slate-900/90 p-4 text-xs text-white">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

function SignaturePreview({ data }: { data: Record<string, unknown> | null }) {
  const artifacts = useMemo(() => {
    if (!data) {
      return [] as Record<string, unknown>[];
    }
    const rows = (data["artifacts"] as unknown) ?? [];
    return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
  }, [data]);

  if (!data) {
    return null;
  }

  return (
    <details className="rounded-2xl border border-slate-100 bg-white/80 p-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
      <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-white">
        Signature manifest ({artifacts.length} artifact{artifacts.length === 1 ? "" : "s"})
      </summary>
      <div className="mt-4 space-y-3">
        {artifacts.map((artifact) => (
          <div
            key={String(artifact.label ?? artifact.path ?? Math.random())}
            className="rounded-2xl border border-slate-100/70 bg-slate-50/80 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{String(artifact.label ?? "Artifact")}</p>
            <div className="mt-1 grid gap-2 md:grid-cols-2">
              <p className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate text-xs text-slate-500">{String(artifact.hash ?? "hash unavailable")}</span>
              </p>
              <p className="flex items-center gap-2">
                <DownloadCloud className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate text-xs text-slate-500">{String(artifact.path ?? "path unavailable")}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function VerificationPanel({ entry }: { entry: VerificationEntry | undefined }) {
  if (!entry || entry.status === "idle") {
    return null;
  }

  if (entry.status === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
        <RefreshCcw className="h-4 w-4 animate-spin" />
        Verifying dossier artifacts…
      </div>
    );
  }

  if (entry.status === "error") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-100">
        <FileWarning className="h-4 w-4" />
        {entry.error ?? "Verification failed."}
      </div>
    );
  }

  if (!entry.report) {
    return null;
  }

  const { report } = entry;
  const badgeVariant: "success" | "warning" = report.allVerified ? "success" : "warning";
  const headline = report.allVerified
    ? "All artifacts verified"
    : `${report.missingCount} missing · ${report.mismatchCount} mismatched`;

  return (
    <div className="space-y-3 rounded-3xl border border-teal-200 bg-teal-50/80 p-4 text-sm text-teal-900 shadow-inner dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-100">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4" />
          {headline} · {report.algorithm}
        </div>
        <Badge variant={badgeVariant}>{badgeVariant === "success" ? "Verified" : "Attention"}</Badge>
      </div>
      {report.warnings.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-xs">
          {report.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {report.artifacts.map((artifact) => (
          <div
            key={`${artifact.label}-${artifact.path ?? "unknown"}`}
            className="rounded-2xl border border-white/50 bg-white/80 p-3 text-xs text-slate-600 shadow-sm dark:border-teal-200/20 dark:bg-slate-950/30 dark:text-teal-50"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{artifact.label}</p>
            <p className="mt-1 text-[0.7rem] text-slate-500 dark:text-teal-100/70">{artifact.path ?? "path unavailable"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[0.7rem]">
              <span className={clsx("rounded-full px-2 py-1", artifact.exists ? "bg-teal-100 text-teal-700" : "bg-rose-100 text-rose-700")}>{
                artifact.exists ? "Present" : "Missing"
              }</span>
              <span className={clsx("rounded-full px-2 py-1", artifact.matches ? "bg-teal-100 text-teal-700" : "bg-amber-100 text-amber-700")}>{
                artifact.matches ? "Hash match" : "Hash mismatch"
              }</span>
            </div>
            <p className="mt-2 text-[0.7rem] text-slate-500">
              {artifact.expectedHash ? `Expected ${artifact.expectedHash.slice(0, 12)}…` : "Expected hash unavailable"}
            </p>
            {artifact.error && <p className="mt-1 text-[0.7rem] text-rose-500">{artifact.error}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DossierList({ response, includeManifest }: DossierListProps) {
  const [verifications, setVerifications] = useState<Record<string, VerificationEntry>>({});
  const items: DossierRecord[] = response.items;

  async function handleVerify(planId: string) {
    setVerifications((prev) => ({
      ...prev,
      [planId]: { status: "loading" },
    }));

    try {
      const res = await fetch("/api/dossiers/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Verification failed");
      }

      const report = (await res.json()) as DossierVerificationReport;
      setVerifications((prev) => ({
        ...prev,
        [planId]: { status: "success", report },
      }));
    } catch (error) {
      setVerifications((prev) => ({
        ...prev,
        [planId]: {
          status: "error",
          error: error instanceof Error ? error.message : "Verification failed",
        },
      }));
    }
  }

  if (!items.length) {
    return (
      <Card className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
        <ShieldQuestion className="mx-auto mb-4 h-10 w-10 text-slate-300" />
        No dossier plans match the current filters. Try widening the status or increasing the row limit.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((record) => {
        const statusVariant = statusVariantMap[record.status] ?? "default";
        const verificationEntry = verifications[record.planId];
        const payload = normalizePayload(record.payload);
        const cases = extractCaseIds(record);
        const jurisdiction = (payload["jurisdiction"] as string) ?? (payload["jurisdiction_key"] as string) ?? "—";
        const totalLoss = formatCurrency(payload["total_loss_usd"]);

        return (
          <Card
            key={record.planId}
            className="group space-y-5 rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 dark:border-slate-900 dark:bg-slate-900/70"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Plan</p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{record.planId}</h3>
                <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  Updated {formatDate(record.updatedAt)} · queued {formatDate(record.queuedAt)}
                </p>
              </div>
              <Badge variant={statusVariant} className="self-start">
                {record.status}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <StatsRow label="Jurisdiction" value={String(jurisdiction)} />
              <StatsRow label="Total loss" value={totalLoss} />
              <StatsRow label="Cases bundled" value={cases.length ? `${cases.length}` : "—"} />
              <StatsRow label="Warnings" value={record.warnings.length + record.artifactWarnings.length ? `${record.warnings.length + record.artifactWarnings.length}` : "None"} />
            </div>

            {(record.warnings.length > 0 || record.artifactWarnings.length > 0 || record.error) && (
              <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
                {[...record.warnings, ...record.artifactWarnings].map((warning) => (
                  <p key={warning} className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {warning}
                  </p>
                ))}
                {record.error && (
                  <p className="flex items-center gap-2 text-rose-600 dark:text-rose-200">
                    <FileWarning className="h-4 w-4" />
                    {record.error}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              {record.manifestPath && (
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Layers className="h-3.5 w-3.5" />
                  {record.manifestPath}
                </span>
              )}
              {record.signatureManifestPath && (
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Hash className="h-3.5 w-3.5" />
                  {record.signatureManifestPath}
                </span>
              )}
            </div>

            {cases.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                <p className="flex items-center gap-2 text-slate-500">
                  <ListChecks className="h-3.5 w-3.5" />
                  Cases
                </p>
                {cases.map((caseId) => (
                  <span key={caseId} className="rounded-full bg-slate-900/5 px-3 py-1 text-slate-600 dark:bg-slate-100/10 dark:text-slate-200">
                    #{caseId}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                className="gap-2"
                disabled={verificationEntry?.status === "loading"}
                onClick={() => handleVerify(record.planId)}
              >
                <ShieldCheck className="h-4 w-4" />
                {verificationEntry?.status === "loading" ? "Verifying…" : "Verify signatures"}
              </Button>
              <span className="text-xs text-slate-500">
                {includeManifest
                  ? "Manifest payloads inline"
                  : "Enable manifest payloads above to preview JSON"}
              </span>
            </div>

            <VerificationPanel entry={verificationEntry} />

            {includeManifest && record.manifest ? (
              <ManifestPreview data={record.manifest as Record<string, unknown>} />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-300">
                Manifest JSON hidden. Toggle “Include JSON” in the filters to stream manifest payloads.
              </div>
            )}

            <SignaturePreview data={(record.signatureManifest as Record<string, unknown>) ?? null} />

            <details className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-white">
                Dossier plan payload
              </summary>
              <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-slate-900/90 p-4 text-xs text-white">
                {JSON.stringify(record.payload ?? {}, null, 2)}
              </pre>
            </details>
          </Card>
        );
      })}
    </div>
  );
}

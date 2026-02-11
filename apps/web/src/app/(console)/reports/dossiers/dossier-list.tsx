"use client";

import { useState } from "react";
import { Badge, Button, Card } from "@i4g/ui-kit";
import type { DossierRecord, DossierVerificationReport } from "@i4g/sdk";
import {
  AlertTriangle,
  Clock3,
  FileWarning,
  Hash,
  Layers,
  ListChecks,
  ShieldCheck,
  ShieldHalf,
  ShieldQuestion,
} from "lucide-react";

import {
  type ClientVerificationEntry,
  type ClientVerificationReport,
  type DossierListProps,
  type VerificationEntry,
  buildDownloadHref,
  extractCaseIds,
  formatCurrency,
  formatDate,
  normalizePayload,
  normalizeSignatureArtifacts,
  statusVariantMap,
  toHex,
} from "./dossier-utils";
import {
  DownloadsPanel,
  HandoffBanner,
  ManifestPreview,
  SignaturePreview,
  StatsRow,
} from "./dossier-components";
import {
  ClientVerificationPanel,
  VerificationPanel,
} from "./dossier-verification";

export function DossierList({ response, includeManifest }: DossierListProps) {
  const [verifications, setVerifications] = useState<
    Record<string, VerificationEntry>
  >({});
  const [clientVerifications, setClientVerifications] = useState<
    Record<string, ClientVerificationEntry>
  >({});
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
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
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

  async function handleClientVerify(record: DossierRecord) {
    const signatureManifest = record.signatureManifest as Record<
      string,
      unknown
    > | null;
    const artifacts = normalizeSignatureArtifacts(signatureManifest);
    const algorithm = (signatureManifest?.["algorithm"] as string) ?? "sha256";

    if (artifacts.length === 0) {
      setClientVerifications((prev) => ({
        ...prev,
        [record.planId]: {
          status: "error",
          error: "Signature manifest missing artifacts",
        },
      }));
      return;
    }

    setClientVerifications((prev) => ({
      ...prev,
      [record.planId]: { status: "loading" },
    }));

    try {
      const results: ClientVerificationReport["artifacts"] = [];
      for (const artifact of artifacts) {
        if (!artifact.path || !artifact.expectedHash) {
          results.push({
            label: artifact.label,
            path: artifact.path,
            expectedHash: artifact.expectedHash,
            computedHash: null,
            matches: false,
            error: "Missing path or expected hash",
          });
          continue;
        }

        const url = buildDownloadHref(artifact.path).href;
        try {
          const resp = await fetch(url);
          if (!resp.ok) {
            throw new Error(`Fetch failed (${resp.status})`);
          }
          const buffer = await resp.arrayBuffer();
          const digest = await crypto.subtle.digest("SHA-256", buffer);
          const computedHash = toHex(digest);
          results.push({
            label: artifact.label,
            path: artifact.path,
            expectedHash: artifact.expectedHash,
            computedHash,
            matches: computedHash === artifact.expectedHash,
          });
        } catch (error) {
          results.push({
            label: artifact.label,
            path: artifact.path,
            expectedHash: artifact.expectedHash,
            computedHash: null,
            matches: false,
            error: error instanceof Error ? error.message : "Hashing failed",
          });
        }
      }

      setClientVerifications((prev) => ({
        ...prev,
        [record.planId]: {
          status: "success",
          report: { algorithm, artifacts: results },
        },
      }));
    } catch (error) {
      setClientVerifications((prev) => ({
        ...prev,
        [record.planId]: {
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "Client-side verification failed",
        },
      }));
    }
  }

  if (!items.length) {
    return (
      <Card className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
        <ShieldQuestion className="mx-auto mb-4 h-10 w-10 text-slate-300" />
        No dossier plans match the current filters. Try widening the status or
        increasing the row limit.
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
        const jurisdiction =
          (payload["jurisdiction"] as string) ??
          (payload["jurisdiction_key"] as string) ??
          "—";
        const totalLoss = formatCurrency(payload["total_loss_usd"]);

        return (
          <Card
            key={record.planId}
            className="group space-y-5 rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 dark:border-slate-900 dark:bg-slate-900/70"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                  Plan
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                  {record.planId}
                </h3>
                <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  Updated {formatDate(record.updatedAt)} · queued{" "}
                  {formatDate(record.queuedAt)}
                </p>
              </div>
              <Badge variant={statusVariant} className="self-start">
                {record.status}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <StatsRow label="Jurisdiction" value={String(jurisdiction)} />
              <StatsRow label="Total loss" value={totalLoss} />
              <StatsRow
                label="Cases bundled"
                value={cases.length ? `${cases.length}` : "—"}
              />
              <StatsRow
                label="Warnings"
                value={
                  record.warnings.length + record.artifactWarnings.length
                    ? `${record.warnings.length + record.artifactWarnings.length}`
                    : "None"
                }
              />
            </div>

            {(record.warnings.length > 0 ||
              record.artifactWarnings.length > 0 ||
              record.error) && (
              <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
                {[...record.warnings, ...record.artifactWarnings].map(
                  (warning) => (
                    <p key={warning} className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {warning}
                    </p>
                  ),
                )}
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

            <DownloadsPanel downloads={record.downloads} />

            <HandoffBanner downloads={record.downloads} />

            {cases.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                <p className="flex items-center gap-2 text-slate-500">
                  <ListChecks className="h-3.5 w-3.5" />
                  Cases
                </p>
                {cases.map((caseId) => (
                  <span
                    key={caseId}
                    className="rounded-full bg-slate-900/5 px-3 py-1 text-slate-600 dark:bg-slate-100/10 dark:text-slate-200"
                  >
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
                {verificationEntry?.status === "loading"
                  ? "Verifying…"
                  : "Verify signatures"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                disabled={
                  clientVerifications[record.planId]?.status === "loading"
                }
                onClick={() => handleClientVerify(record)}
              >
                <ShieldHalf className="h-4 w-4" />
                {clientVerifications[record.planId]?.status === "loading"
                  ? "Verifying locally…"
                  : "Verify client-side"}
              </Button>
              <span className="text-xs text-slate-500">
                {includeManifest
                  ? "Manifest payloads inline"
                  : "Enable manifest payloads above to preview JSON"}
              </span>
            </div>

            <VerificationPanel entry={verificationEntry} />

            <ClientVerificationPanel
              entry={clientVerifications[record.planId]}
            />

            {includeManifest && record.manifest ? (
              <ManifestPreview
                data={record.manifest as Record<string, unknown>}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-300">
                Manifest JSON hidden. Toggle “Include JSON” in the filters to
                stream manifest payloads.
              </div>
            )}

            <SignaturePreview
              data={
                (record.signatureManifest as Record<string, unknown>) ?? null
              }
            />

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

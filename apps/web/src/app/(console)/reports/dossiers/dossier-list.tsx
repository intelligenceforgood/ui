"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card } from "@i4g/ui-kit";
import type {
  DossierDownloads,
  DossierListResponse,
  DossierRecord,
  DossierRemoteDownload,
  DossierVerificationReport,
} from "@i4g/sdk";
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
  ClipboardCopy,
  Link2,
  ShieldHalf,
} from "lucide-react";

import clsx from "clsx";

type VerificationEntry = {
  status: "idle" | "loading" | "success" | "error";
  report?: DossierVerificationReport;
  error?: string;
};

type ClientVerificationReport = {
  algorithm: string;
  artifacts: Array<{
    label: string;
    path: string | null;
    expectedHash: string | null;
    computedHash: string | null;
    matches: boolean;
    error?: string;
  }>;
};

type ClientVerificationEntry = {
  status: "idle" | "loading" | "success" | "error";
  report?: ClientVerificationReport;
  error?: string;
};

type DossierListProps = {
  response: DossierListResponse;
  includeManifest: boolean;
};

const statusVariantMap: Record<
  string,
  "default" | "success" | "warning" | "danger" | "info"
> = {
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

function normalizePayload(
  payload: DossierRecord["payload"],
): Record<string, unknown> {
  if (payload && typeof payload === "object") {
    return payload as Record<string, unknown>;
  }
  return {};
}

function isHttpUrl(value?: string | null) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function formatPathPreview(value: string) {
  if (value.length <= 48) {
    return value;
  }
  return `${value.slice(0, 18)}…${value.slice(-20)}`;
}

function formatBytes(value?: number | null) {
  if (typeof value !== "number") {
    return "";
  }
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function buildDownloadHref(path: string) {
  if (isHttpUrl(path)) {
    return { href: path, external: true };
  }
  return {
    href: `/api/dossiers/download?path=${encodeURIComponent(path)}`,
    external: false,
  };
}

function buildShareableLinks(downloads: DossierDownloads): string[] {
  const links: string[] = [];
  const localPaths = [
    downloads.local.pdf,
    downloads.local.html,
    downloads.local.markdown,
    downloads.local.manifest,
    downloads.local.signatureManifest,
  ].filter(Boolean) as string[];

  for (const path of localPaths) {
    links.push(buildDownloadHref(path).href);
  }
  for (const remote of downloads.remote) {
    if (remote.remoteRef) {
      links.push(remote.remoteRef);
    }
  }

  return Array.from(new Set(links));
}

function toHex(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeSignatureArtifacts(
  manifest: Record<string, unknown> | null | undefined,
) {
  if (!manifest) {
    return [] as Array<{
      label: string;
      path: string | null;
      expectedHash: string | null;
    }>;
  }
  const artifactsRaw = manifest["artifacts"] as unknown;
  if (!Array.isArray(artifactsRaw)) {
    return [] as Array<{
      label: string;
      path: string | null;
      expectedHash: string | null;
    }>;
  }
  return (artifactsRaw as Record<string, unknown>[]).map((entry) => ({
    label: String(entry.label ?? entry.path ?? "Artifact"),
    path: (entry.path as string) ?? null,
    expectedHash:
      (entry.hash as string) ?? (entry.expected_hash as string) ?? null,
  }));
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
      <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function ManifestPreview({ data }: { data: Record<string, unknown> | null }) {
  if (!data) {
    return null;
  }
  return (
    <details className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
      <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-white">
        Manifest JSON
      </summary>
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
        Signature manifest ({artifacts.length} artifact
        {artifacts.length === 1 ? "" : "s"})
      </summary>
      <div className="mt-4 space-y-3">
        {artifacts.map((artifact) => (
          <div
            key={String(artifact.label ?? artifact.path ?? Math.random())}
            className="rounded-2xl border border-slate-100/70 bg-slate-50/80 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {String(artifact.label ?? "Artifact")}
            </p>
            <div className="mt-1 grid gap-2 md:grid-cols-2">
              <p className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate text-xs text-slate-500">
                  {String(artifact.hash ?? "hash unavailable")}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <DownloadCloud className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate text-xs text-slate-500">
                  {String(artifact.path ?? "path unavailable")}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function DownloadChip({ label, path }: { label: string; path: string | null }) {
  if (!path) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        <DownloadCloud className="h-3.5 w-3.5" />
        {label} unavailable
      </span>
    );
  }

  const { href, external } = buildDownloadHref(path);
  const preview = formatPathPreview(path);

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-teal-400 hover:text-teal-700 dark:border-teal-400/30 dark:bg-slate-900/50 dark:text-teal-100"
    >
      <DownloadCloud className="h-3.5 w-3.5" />
      {label}
      <span className="text-[0.7rem] font-normal text-slate-500 dark:text-teal-100/70">
        {preview}
      </span>
    </a>
  );
}

function RemoteDownloadRow({ entry }: { entry: DossierRemoteDownload }) {
  const hasLink = isHttpUrl(entry.remoteRef);
  const preview = entry.remoteRef
    ? formatPathPreview(entry.remoteRef)
    : "Remote reference unavailable";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white/80 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {entry.label}
        </p>
        <p className="text-[0.7rem] text-slate-500 dark:text-teal-100/70">
          {preview}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {hasLink && (
          <a
            href={entry.remoteRef ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-white px-2 py-1 text-[0.7rem] font-semibold text-teal-700 transition hover:border-teal-400 hover:text-teal-800 dark:border-teal-400/30 dark:bg-slate-900/40 dark:text-teal-100"
          >
            Open
          </a>
        )}
        {entry.hash && (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[0.65rem] text-slate-600 dark:bg-slate-800 dark:text-teal-100/80">
            {(entry.algorithm ?? "hash").toUpperCase()}:{" "}
            {entry.hash.slice(0, 10)}…
          </span>
        )}
        {typeof entry.sizeBytes === "number" && (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[0.65rem] text-slate-600 dark:bg-slate-800 dark:text-teal-100/80">
            {formatBytes(entry.sizeBytes)}
          </span>
        )}
      </div>
    </div>
  );
}

function DownloadsPanel({ downloads }: { downloads: DossierDownloads }) {
  const localItems = [
    { label: "Manifest", path: downloads.local.manifest },
    { label: "Markdown", path: downloads.local.markdown },
    { label: "PDF", path: downloads.local.pdf },
    { label: "HTML", path: downloads.local.html },
    { label: "Signature manifest", path: downloads.local.signatureManifest },
  ];

  const hasLocal = localItems.some((item) => Boolean(item.path));
  const hasRemote = downloads.remote.length > 0;

  if (!hasLocal && !hasRemote) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-white">
        <DownloadCloud className="h-4 w-4" />
        Downloads
      </div>
      {hasLocal && (
        <div className="flex flex-wrap gap-2">
          {localItems.map((item) => (
            <DownloadChip
              key={item.label}
              label={item.label}
              path={item.path}
            />
          ))}
        </div>
      )}
      {hasRemote && (
        <div className="space-y-2">
          {downloads.remote.map((entry, index) => (
            <RemoteDownloadRow key={`${entry.label}-${index}`} entry={entry} />
          ))}
        </div>
      )}
      {!hasLocal && hasRemote && (
        <p className="text-xs text-slate-500 dark:text-teal-100/70">
          Local artifacts unavailable from the API response; remote uploads
          shown instead.
        </p>
      )}
    </div>
  );
}

function HandoffBanner({ downloads }: { downloads: DossierDownloads }) {
  const [copied, setCopied] = useState(false);
  const shareableLinks = buildShareableLinks(downloads);
  const hasRemote = downloads.remote.length > 0;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareableLinks.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn("Copy failed", error);
      setCopied(false);
    }
  }

  if (!shareableLinks.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 text-sm text-teal-900 shadow-sm dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold">
          <Link2 className="h-4 w-4" />
          LEA handoff
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="gap-2"
          onClick={handleCopy}
        >
          <ClipboardCopy className="h-4 w-4" />
          {copied ? "Copied" : "Copy links"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-teal-900/80 dark:text-teal-100/80">
        Includes manifest and artifact links for partner download. Remote refs{" "}
        {hasRemote
          ? "include Drive uploads."
          : "fall back to local paths via the proxy."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-[0.75rem] text-teal-900/80 dark:text-teal-50/80">
        {shareableLinks.map((link) => (
          <span
            key={link}
            className="rounded-full bg-white/80 px-3 py-1 dark:bg-slate-900/40"
          >
            {formatPathPreview(link)}
          </span>
        ))}
      </div>
    </div>
  );
}

function VerificationPanel({
  entry,
}: {
  entry: VerificationEntry | undefined;
}) {
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
  const badgeVariant: "success" | "warning" = report.allVerified
    ? "success"
    : "warning";
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
        <Badge variant={badgeVariant}>
          {badgeVariant === "success" ? "Verified" : "Attention"}
        </Badge>
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
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {artifact.label}
            </p>
            <p className="mt-1 text-[0.7rem] text-slate-500 dark:text-teal-100/70">
              {artifact.path ?? "path unavailable"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[0.7rem]">
              <span
                className={clsx(
                  "rounded-full px-2 py-1",
                  artifact.exists
                    ? "bg-teal-100 text-teal-700"
                    : "bg-rose-100 text-rose-700",
                )}
              >
                {artifact.exists ? "Present" : "Missing"}
              </span>
              <span
                className={clsx(
                  "rounded-full px-2 py-1",
                  artifact.matches
                    ? "bg-teal-100 text-teal-700"
                    : "bg-amber-100 text-amber-700",
                )}
              >
                {artifact.matches ? "Hash match" : "Hash mismatch"}
              </span>
            </div>
            <p className="mt-2 text-[0.7rem] text-slate-500">
              {artifact.expectedHash
                ? `Expected ${artifact.expectedHash.slice(0, 12)}…`
                : "Expected hash unavailable"}
            </p>
            {artifact.error && (
              <p className="mt-1 text-[0.7rem] text-rose-500">
                {artifact.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientVerificationPanel({
  entry,
}: {
  entry: ClientVerificationEntry | undefined;
}) {
  if (!entry || entry.status === "idle") {
    return null;
  }

  if (entry.status === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
        <RefreshCcw className="h-4 w-4 animate-spin" />
        Verifying locally…
      </div>
    );
  }

  if (entry.status === "error") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-100">
        <FileWarning className="h-4 w-4" />
        {entry.error ?? "Client-side verification failed."}
      </div>
    );
  }

  if (!entry.report) {
    return null;
  }

  const mismatches = entry.report.artifacts.filter(
    (artifact) => !artifact.matches || artifact.error,
  );

  return (
    <div className="space-y-3 rounded-3xl border border-indigo-200 bg-indigo-50/80 p-4 text-sm text-indigo-900 shadow-inner dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-100">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldHalf className="h-4 w-4" />
          Client-side hash check · {entry.report.algorithm}
        </div>
        <Badge variant={mismatches.length === 0 ? "success" : "warning"}>
          {mismatches.length === 0 ? "Matched" : "Attention"}
        </Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {entry.report.artifacts.map((artifact) => (
          <div
            key={`${artifact.label}-${artifact.path ?? "unknown"}`}
            className={clsx(
              "rounded-2xl border bg-white/80 p-3 text-xs text-slate-600 shadow-sm dark:bg-slate-950/30",
              artifact.matches && !artifact.error
                ? "border-white/50 dark:border-indigo-200/20"
                : "border-amber-200 dark:border-amber-300/40",
            )}
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {artifact.label}
            </p>
            <p className="mt-1 text-[0.7rem] text-slate-500 dark:text-indigo-100/70">
              {artifact.path ?? "path unavailable"}
            </p>
            <p className="mt-2 text-[0.7rem] text-slate-500">
              Expected {artifact.expectedHash?.slice(0, 12) ?? "unknown"}…
            </p>
            <p className="text-[0.7rem] text-slate-500">
              Computed {artifact.computedHash?.slice(0, 12) ?? "n/a"}…
            </p>
            {artifact.error && (
              <p className="mt-1 text-[0.7rem] text-rose-500">
                {artifact.error}
              </p>
            )}
            {!artifact.error && (
              <span
                className={clsx(
                  "mt-2 inline-flex rounded-full px-2 py-1",
                  artifact.matches
                    ? "bg-teal-100 text-teal-700"
                    : "bg-amber-100 text-amber-700",
                )}
              >
                {artifact.matches ? "Hash match" : "Mismatch"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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

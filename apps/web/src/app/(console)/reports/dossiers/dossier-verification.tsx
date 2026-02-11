import { Badge } from "@i4g/ui-kit";
import { FileWarning, RefreshCcw, ShieldCheck, ShieldHalf } from "lucide-react";
import clsx from "clsx";
import type {
  ClientVerificationEntry,
  VerificationEntry,
} from "./dossier-utils";

/* ---------- VerificationPanel (server-side) ---------- */

export function VerificationPanel({
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
      {report.warnings && report.warnings.length > 0 && (
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

/* ---------- ClientVerificationPanel (browser-side) ---------- */

export function ClientVerificationPanel({
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

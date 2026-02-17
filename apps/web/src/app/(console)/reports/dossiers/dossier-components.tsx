"use client";

import { useMemo, useState } from "react";
import { Button } from "@i4g/ui-kit";
import type { DossierDownloads, DossierRemoteDownload } from "@i4g/sdk";
import { ClipboardCopy, DownloadCloud, Hash, Link2 } from "lucide-react";
import {
  buildDownloadHref,
  buildShareableLinks,
  formatBytes,
  formatPathPreview,
  isHttpUrl,
} from "./dossier-utils";
import { PreWithTokens } from "@/components/pre-with-tokens";

/* ---------- StatsRow ---------- */

export function StatsRow({ label, value }: { label: string; value: string }) {
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

/* ---------- ManifestPreview ---------- */

export function ManifestPreview({
  data,
}: {
  data: Record<string, unknown> | null;
}) {
  if (!data) {
    return null;
  }
  return (
    <details className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
      <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-white">
        Manifest JSON
      </summary>
      <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-slate-900/90 p-4 text-xs text-white">
        <PreWithTokens text={JSON.stringify(data, null, 2)} />
      </pre>
    </details>
  );
}

/* ---------- SignaturePreview ---------- */

export function SignaturePreview({
  data,
}: {
  data: Record<string, unknown> | null;
}) {
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

/* ---------- DownloadChip ---------- */

export function DownloadChip({
  label,
  path,
}: {
  label: string;
  path: string | null;
}) {
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

/* ---------- RemoteDownloadRow ---------- */

export function RemoteDownloadRow({ entry }: { entry: DossierRemoteDownload }) {
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

/* ---------- DownloadsPanel ---------- */

export function DownloadsPanel({ downloads }: { downloads: DossierDownloads }) {
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

/* ---------- HandoffBanner ---------- */

export function HandoffBanner({ downloads }: { downloads: DossierDownloads }) {
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

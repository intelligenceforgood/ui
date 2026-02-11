import type {
  DossierDownloads,
  DossierRecord,
  DossierVerificationReport,
} from "@i4g/sdk";

/* ---------- Local types ---------- */

export type VerificationEntry = {
  status: "idle" | "loading" | "success" | "error";
  report?: DossierVerificationReport;
  error?: string;
};

export type ClientVerificationReport = {
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

export type ClientVerificationEntry = {
  status: "idle" | "loading" | "success" | "error";
  report?: ClientVerificationReport;
  error?: string;
};

export type DossierListProps = {
  response: import("@i4g/sdk").DossierListResponse;
  includeManifest: boolean;
};

/* ---------- Constants ---------- */

export const statusVariantMap: Record<
  string,
  "default" | "success" | "warning" | "danger" | "info"
> = {
  completed: "success",
  pending: "warning",
  leased: "info",
  failed: "danger",
};

/* ---------- Formatters ---------- */

export function formatDate(value?: string | null) {
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

export function formatCurrency(value?: unknown) {
  if (typeof value !== "number") {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function normalizePayload(
  payload: DossierRecord["payload"],
): Record<string, unknown> {
  if (payload && typeof payload === "object") {
    return payload as Record<string, unknown>;
  }
  return {};
}

export function isHttpUrl(value?: string | null) {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

export function formatPathPreview(value: string) {
  if (value.length <= 48) {
    return value;
  }
  return `${value.slice(0, 18)}…${value.slice(-20)}`;
}

export function formatBytes(value?: number | null) {
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

export function buildDownloadHref(path: string) {
  if (isHttpUrl(path)) {
    return { href: path, external: true };
  }
  return {
    href: `/api/dossiers/download?path=${encodeURIComponent(path)}`,
    external: false,
  };
}

export function buildShareableLinks(downloads: DossierDownloads): string[] {
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

export function toHex(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function normalizeSignatureArtifacts(
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

export function extractCaseIds(record: DossierRecord): string[] {
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

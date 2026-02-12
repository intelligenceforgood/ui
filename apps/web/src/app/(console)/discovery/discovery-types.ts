/* ─── Types & helpers for the Discovery panel ─── */

export const textAreaClasses =
  "min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100";

export const initialFormState = {
  query: "",
  pageSize: 10,
  project: "",
  location: "",
  dataStoreId: "",
  servingConfigId: "",
  filterExpression: "",
  boostJson: "",
};

export type DiscoverySearchRequest = typeof initialFormState;

export type DiscoveryPanelDefaults = Partial<
  Pick<
    DiscoverySearchRequest,
    "project" | "location" | "dataStoreId" | "servingConfigId"
  >
>;

export type DiscoveryResult = {
  rank: number;
  documentId: string;
  documentName: string;
  summary?: string | null;
  label?: string | null;
  tags: string[];
  source?: string | null;
  indexType?: string | null;
  struct: Record<string, unknown>;
  rankSignals: Record<string, unknown>;
  raw: unknown;
};

export type DiscoverySearchResponse = {
  results: DiscoveryResult[];
  totalSize: number;
  nextPageToken?: string;
};

/* ─── Formatting helpers ─── */

function extractDocumentSegment(value: string) {
  const withDocuments = value.split("/documents/").pop() ?? value;
  return withDocuments.includes("/")
    ? withDocuments.split("/").pop() ?? withDocuments
    : withDocuments;
}

export function formatDocumentName(name?: string | null) {
  if (!name) {
    return "Unknown document";
  }
  const segment = extractDocumentSegment(name);
  if (segment.length <= 24) {
    return segment;
  }
  if (segment.startsWith("hash_")) {
    return `${segment.slice(0, 12)}…${segment.slice(-6)}`;
  }
  return `${segment.slice(0, 12)}…${segment.slice(-4)}`;
}

export function formatDocumentId(documentId?: string | null) {
  if (!documentId) {
    return "Unknown";
  }
  const segment = extractDocumentSegment(documentId);
  if (segment.length <= 20) {
    return segment;
  }
  return `${segment.slice(0, 10)}…${segment.slice(-6)}`;
}

/* ─── Redaction helpers ─── */

const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const FULL_NAME_REGEX = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
const ADDRESS_REGEX = /\b\d{1,5}\s+[A-Z0-9][A-Z0-9\s]+\b/g;

function maskWithBlocks(match: string) {
  return "█".repeat(match.length);
}

export function redactSensitiveText(value?: string | null) {
  if (!value) {
    return value ?? "";
  }

  return value
    .replace(EMAIL_REGEX, maskWithBlocks)
    .replace(FULL_NAME_REGEX, maskWithBlocks)
    .replace(ADDRESS_REGEX, maskWithBlocks);
}

export function redactJsonForDisplay(payload: unknown) {
  try {
    return redactSensitiveText(JSON.stringify(payload, null, 2));
  } catch {
    return "[unavailable]";
  }
}

/* ─── Payload builder ─── */

export function buildPayload(form: DiscoverySearchRequest) {
  const trimmedQuery = form.query.trim();
  const payload: Record<string, unknown> = {
    query: trimmedQuery,
    pageSize: Number.isFinite(form.pageSize) ? form.pageSize : 10,
  };

  const optionalFields: Array<[keyof DiscoverySearchRequest, string]> = [
    ["project", form.project],
    ["location", form.location],
    ["dataStoreId", form.dataStoreId],
    ["servingConfigId", form.servingConfigId],
    ["filterExpression", form.filterExpression],
    ["boostJson", form.boostJson],
  ];

  optionalFields.forEach(([key, value]) => {
    const trimmed = value?.trim();
    if (trimmed) {
      payload[key] = key === "pageSize" ? Number(trimmed) : trimmed;
    }
  });

  return payload;
}

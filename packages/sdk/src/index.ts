import { z } from "zod";

const scoredLabelSchema = z.object({
  label: z.string(),
  confidence: z.number().min(0).max(1),
  explanation: z.string().optional().nullable(),
});

export type ScoredLabel = z.infer<typeof scoredLabelSchema>;

const fraudClassificationResultSchema = z
  .object({
    intent: z.array(scoredLabelSchema),
    channel: z.array(scoredLabelSchema),
    techniques: z.array(scoredLabelSchema),
    actions: z.array(scoredLabelSchema),
    persona: z.array(scoredLabelSchema),
    explanation: z.string().optional().nullable(),
    few_shot_examples: z.array(z.record(z.unknown())).optional(),
    risk_score: z.number().min(0).max(100),
    taxonomy_version: z.string(),
  })
  .passthrough();

export type FraudClassificationResult = z.infer<
  typeof fraudClassificationResultSchema
>;

export const intakeSchema = z.object({
  intake_id: z.string(),
  summary: z.string(),
  taxonomy: z.string(),
  submitted_at: z.string(),
  priority: z.enum(["high", "medium", "low"]),
});

export type IntakeRecord = z.infer<typeof intakeSchema>;

export function parseIntakes(data: unknown) {
  return z.array(intakeSchema).parse(data);
}

const metricSchema = z.object({
  label: z.string(),
  value: z.string(),
  change: z.string(),
});

export type DashboardMetric = z.infer<typeof metricSchema>;

const alertSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string(),
  time: z.string(),
  variant: z.enum(["danger", "warning", "success", "info", "default"]),
});

export type DashboardAlert = z.infer<typeof alertSchema>;

const activitySchema = z.object({
  id: z.string(),
  title: z.string(),
  actor: z.string(),
  when: z.string(),
});

export type DashboardActivity = z.infer<typeof activitySchema>;

const reminderSchema = z.object({
  id: z.string(),
  text: z.string(),
  category: z.enum(["coordination", "legal", "data", "alert"]),
});

export type DashboardReminder = z.infer<typeof reminderSchema>;

const dashboardOverviewSchema = z.object({
  metrics: z.array(metricSchema),
  alerts: z.array(alertSchema),
  activity: z.array(activitySchema),
  reminders: z.array(reminderSchema),
});

export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;

const searchTimeRangeSchema = z.object({
  start: z.string(),
  end: z.string(),
});

const searchEntityFilterSchema = z.object({
  type: z.string().min(1, "Entity type is required"),
  value: z.string().min(1, "Entity value is required"),
  matchMode: z.enum(["exact", "prefix", "contains"]).default("exact"),
});

const searchRequestSchema = z
  .object({
    query: z.string().default(""),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(10),
    sources: z.array(z.string()).optional(),
    taxonomy: z.array(z.string()).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    classifications: z.array(z.string()).optional(),
    datasets: z.array(z.string()).optional(),
    indicatorTypes: z.array(z.string()).optional(),
    lossBuckets: z.array(z.string()).optional(),
    timePreset: z.string().optional(),
    timeRange: searchTimeRangeSchema.optional(),
    entities: z.array(searchEntityFilterSchema).optional(),
    caseIds: z.array(z.string()).optional(),
    savedSearchId: z.string().optional(),
    savedSearchName: z.string().optional(),
    savedSearchOwner: z.string().optional(),
    savedSearchTags: z.array(z.string()).optional(),
  })
  .refine(
    (payload) => {
      if (!payload.fromDate && !payload.toDate) {
        return true;
      }
      if (payload.fromDate && payload.toDate) {
        return (
          new Date(payload.fromDate).getTime() <=
          new Date(payload.toDate).getTime()
        );
      }
      return false;
    },
    {
      message:
        "fromDate and toDate must both be provided and fromDate must be before toDate",
      path: ["fromDate"],
    },
  );

export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type SearchRequestInput = z.input<typeof searchRequestSchema>;
export type SearchEntityFilter = z.infer<typeof searchEntityFilterSchema>;
export type SearchTimeRange = z.infer<typeof searchTimeRangeSchema>;

const searchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  snippet: z.string(),
  source: z.string(),
  tags: z.array(z.string()),
  classification: fraudClassificationResultSchema.nullable().optional(),
  score: z.number(),
  occurredAt: z.string(),
  confidence: z.number().optional(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

const searchFacetSchema = z.object({
  field: z.string(),
  label: z.string(),
  options: z.array(z.object({ value: z.string(), count: z.number() })),
});

export type SearchFacet = z.infer<typeof searchFacetSchema>;

const searchResponseSchema = z.object({
  results: z.array(searchResultSchema),
  stats: z.object({
    query: z.string(),
    total: z.number(),
    took: z.number(),
    page: z.number(),
    pageSize: z.number(),
  }),
  facets: z.array(searchFacetSchema),
  suggestions: z.array(z.string()),
});

export type SearchResponse = z.infer<typeof searchResponseSchema>;

const caseSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  status: z.enum([
    "new",
    "queued",
    "in_review",
    "awaiting_input",
    "closed",
    "accepted",
    "rejected",
  ]),
  updatedAt: z.string(),
  assignee: z.string().nullable().optional(),
  queue: z.string().nullable().optional(),
  tags: z.array(z.string()),
  classification: fraudClassificationResultSchema.nullable().optional(),
  progress: z.number().min(0).max(100).nullable().optional(),
  dueAt: z.string().nullable().optional(),
});

export type CaseSummary = z.infer<typeof caseSummarySchema>;

const caseQueueSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  count: z.number(),
});

export type CaseQueue = z.infer<typeof caseQueueSchema>;

const casesResponseSchema = z.object({
  summary: z.object({
    active: z.number(),
    dueToday: z.number(),
    pendingReview: z.number(),
    escalations: z.number(),
  }),
  cases: z.array(caseSummarySchema),
  queues: z.array(caseQueueSchema),
});

export type CasesResponse = z.infer<typeof casesResponseSchema>;

const caseArtifactSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  url: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CaseArtifact = z.infer<typeof caseArtifactSchema>;

const caseTimelineEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  description: z.string(),
  actor: z.string().nullable().optional(),
  type: z.string(),
});
export type CaseTimelineEvent = z.infer<typeof caseTimelineEventSchema>;

const caseGraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string(),
  data: z.record(z.unknown()).optional(),
});
export type CaseGraphNode = z.infer<typeof caseGraphNodeSchema>;

const caseGraphLinkSchema = z.object({
  source: z.string(),
  target: z.string(),
  relation: z.string(),
});
export type CaseGraphLink = z.infer<typeof caseGraphLinkSchema>;

export const caseDetailSchema = caseSummarySchema.extend({
  description: z.string().optional(),
  artifacts: z.array(caseArtifactSchema),
  timeline: z.array(caseTimelineEventSchema),
  graphNodes: z.array(caseGraphNodeSchema),
  graphLinks: z.array(caseGraphLinkSchema),
});
export type CaseDetail = z.infer<typeof caseDetailSchema>;

export const taxonomyItemSchema = z.object({
  code: z.string(),
  label: z.string(),
  description: z.string(),
  examples: z.array(z.string()),
});

export type TaxonomyItem = z.infer<typeof taxonomyItemSchema>;

export const taxonomyAxisSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  items: z.array(taxonomyItemSchema),
});

export type TaxonomyAxis = z.infer<typeof taxonomyAxisSchema>;

const taxonomyResponseSchema = z.object({
  version: z.string(),
  steward: z.string(),
  updatedAt: z.string(),
  axes: z.array(taxonomyAxisSchema),
});

export type TaxonomyResponse = z.infer<typeof taxonomyResponseSchema>;

const analyticsMetricSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  change: z.string(),
  trend: z.enum(["up", "down", "flat"]),
});

export type AnalyticsMetric = z.infer<typeof analyticsMetricSchema>;

const timeSeriesPointSchema = z.object({
  label: z.string(),
  value: z.number(),
});

const pipelineBreakdownSchema = z.object({
  label: z.string(),
  value: z.number(),
});

const geographyBreakdownSchema = z.object({
  region: z.string(),
  value: z.number(),
});

const weeklyIncidentSchema = z.object({
  week: z.string(),
  incidents: z.number(),
  interventions: z.number(),
});

const analyticsOverviewSchema = z.object({
  metrics: z.array(analyticsMetricSchema),
  detectionRateSeries: z.array(timeSeriesPointSchema),
  pipelineBreakdown: z.array(pipelineBreakdownSchema),
  geographyBreakdown: z.array(geographyBreakdownSchema),
  weeklyIncidents: z.array(weeklyIncidentSchema),
});

export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>;

const dossierLocalDownloadsWireSchema = z.object({
  manifest: z.string().nullable().optional(),
  markdown: z.string().nullable().optional(),
  pdf: z.string().nullable().optional(),
  html: z.string().nullable().optional(),
  signature_manifest: z.string().nullable().optional(),
});

const dossierRemoteDownloadWireSchema = z.object({
  label: z.string(),
  remote_ref: z.string().nullable().optional(),
  hash: z.string().nullable().optional(),
  algorithm: z.string().nullable().optional(),
  size_bytes: z.number().nullable().optional(),
});

const dossierDownloadsWireSchema = z.object({
  local: dossierLocalDownloadsWireSchema.optional(),
  remote: z.array(dossierRemoteDownloadWireSchema).optional(),
});

type DossierDownloadsWire = z.infer<typeof dossierDownloadsWireSchema>;

const dossierRecordWireSchema = z.object({
  plan_id: z.string(),
  status: z.string(),
  queued_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  warnings: z.array(z.string()).optional(),
  error: z.string().nullable().optional(),
  payload: z.record(z.unknown()).nullable().optional(),
  manifest_path: z.string().nullable().optional(),
  manifest: z.record(z.unknown()).nullable().optional(),
  signature_manifest_path: z.string().nullable().optional(),
  signature_manifest: z.record(z.unknown()).nullable().optional(),
  artifact_warnings: z.array(z.string()).optional(),
  downloads: dossierDownloadsWireSchema.optional(),
});

type DossierRecordWire = z.infer<typeof dossierRecordWireSchema>;

export type DossierRecord = {
  planId: string;
  status: string;
  queuedAt: string | null;
  updatedAt: string | null;
  warnings: string[];
  error: string | null;
  payload: Record<string, unknown> | null;
  manifestPath: string | null;
  manifest: Record<string, unknown> | null;
  signatureManifestPath: string | null;
  signatureManifest: Record<string, unknown> | null;
  artifactWarnings: string[];
  downloads: DossierDownloads;
};

export type DossierListResponse = {
  count: number;
  items: DossierRecord[];
};

export type DossierLocalDownloads = {
  manifest: string | null;
  markdown: string | null;
  pdf: string | null;
  html: string | null;
  signatureManifest: string | null;
};

export type DossierRemoteDownload = {
  label: string;
  remoteRef: string | null;
  hash: string | null;
  algorithm: string | null;
  sizeBytes: number | null;
};

export type DossierDownloads = {
  local: DossierLocalDownloads;
  remote: DossierRemoteDownload[];
};

function normalizeDownloads(
  downloads?: DossierDownloadsWire | null,
): DossierDownloads {
  const local = downloads?.local;
  return {
    local: {
      manifest: local?.manifest ?? null,
      markdown: local?.markdown ?? null,
      pdf: local?.pdf ?? null,
      html: local?.html ?? null,
      signatureManifest: local?.signature_manifest ?? null,
    },
    remote: (downloads?.remote ?? []).map(
      (entry) =>
        ({
          label: entry.label,
          remoteRef: entry.remote_ref ?? null,
          hash: entry.hash ?? null,
          algorithm: entry.algorithm ?? null,
          sizeBytes: entry.size_bytes ?? null,
        }) satisfies DossierRemoteDownload,
    ),
  } satisfies DossierDownloads;
}

function normalizeDossierRecord(record: DossierRecordWire): DossierRecord {
  return {
    planId: record.plan_id,
    status: record.status,
    queuedAt: record.queued_at ?? null,
    updatedAt: record.updated_at ?? null,
    warnings: record.warnings ?? [],
    error: record.error ?? null,
    payload: record.payload ?? null,
    manifestPath: record.manifest_path ?? null,
    manifest: record.manifest ?? null,
    signatureManifestPath: record.signature_manifest_path ?? null,
    signatureManifest: record.signature_manifest ?? null,
    artifactWarnings: record.artifact_warnings ?? [],
    downloads: normalizeDownloads(record.downloads),
  } satisfies DossierRecord;
}

const dossierListWireResponseSchema = z.object({
  count: z.number(),
  items: z.array(dossierRecordWireSchema),
});

const dossierListRequestSchema = z.object({
  status: z.string().default("completed"),
  limit: z.number().int().min(1).max(200).default(20),
  includeManifest: z.boolean().default(false),
});

export type DossierListOptions = z.input<typeof dossierListRequestSchema>;

const dossierVerificationArtifactSchema = z.object({
  label: z.string(),
  path: z.string().nullable().optional(),
  expectedHash: z.string().nullable().optional(),
  actualHash: z.string().nullable().optional(),
  exists: z.boolean().optional(),
  matches: z.boolean().optional(),
  sizeBytes: z.number().nullable().optional(),
  error: z.string().nullable().optional(),
});

export type DossierVerificationArtifact = z.infer<
  typeof dossierVerificationArtifactSchema
>;

const dossierVerificationSchema = z.object({
  planId: z.string(),
  algorithm: z.string(),
  warnings: z.array(z.string()).optional(),
  missingCount: z.number().int(),
  mismatchCount: z.number().int(),
  allVerified: z.boolean(),
  artifacts: z.array(dossierVerificationArtifactSchema),
});

export type DossierVerificationReport = z.infer<
  typeof dossierVerificationSchema
>;

const planIdSchema = z.string().min(1, "planId is required");

export class I4GClientError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "I4GClientError";
    this.status = status;
    this.details = details;
  }
}

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface ClientConfig {
  baseUrl: string;
  apiKey?: string;
  fetchImpl?: FetchLike;
  additionalHeaders?: Record<string, string>;
}

export interface CasesListOptions {
  limit?: number;
  status?: string;
  priority?: string;
  queue?: string;
  due_date?: string;
}

export interface I4GClient {
  getDashboardOverview(): Promise<DashboardOverview>;
  searchIntelligence(request: SearchRequestInput): Promise<SearchResponse>;
  listCases(options?: CasesListOptions): Promise<CasesResponse>;
  getCase(id: string): Promise<CaseDetail>;
  getTaxonomy(): Promise<TaxonomyResponse>;
  getAnalyticsOverview(): Promise<AnalyticsOverview>;
  listDossiers(options?: DossierListOptions): Promise<DossierListResponse>;
  verifyDossier(planId: string): Promise<DossierVerificationReport>;
  detokenize(token: string, caseId?: string): Promise<DetokenizeResponse>;
}

const detokenizeResponseSchema = z.object({
  token: z.string(),
  prefix: z.string(),
  canonicalValue: z.string(),
  pepperVersion: z.string(),
  caseId: z.string().nullable().optional(),
  detector: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
});

export type DetokenizeResponse = z.infer<typeof detokenizeResponseSchema>;

function buildUrl(baseUrl: string, path: string) {
  if (path.startsWith("http")) {
    return path;
  }
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function parseJson(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new I4GClientError("Failed to parse response JSON", response.status, {
      raw: text,
      cause: error,
    });
  }
}

export function createClient(config: ClientConfig): I4GClient {
  const { baseUrl, apiKey, additionalHeaders, fetchImpl } = config;
  const runtimeFetch =
    fetchImpl ??
    (typeof fetch !== "undefined" ? fetch.bind(globalThis) : undefined);

  if (!runtimeFetch) {
    throw new Error("fetch is not available in this environment");
  }

  const fetcher: FetchLike = runtimeFetch;

  async function request<T>(
    path: string,
    schema: z.ZodSchema<T>,
    init?: RequestInit,
  ) {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...additionalHeaders,
    };

    if (apiKey) {
      headers["X-API-KEY"] = apiKey;
    }

    const response = await fetcher(buildUrl(baseUrl, path), {
      ...init,
      headers: {
        ...headers,
        ...init?.headers,
      },
    });

    if (!response.ok) {
      const errorPayload = await parseJson(response);
      throw new I4GClientError(
        `Request failed with status ${response.status}`,
        response.status,
        errorPayload,
      );
    }

    const payload = await parseJson(response);
    return schema.parse(payload);
  }

  return {
    getDashboardOverview() {
      return request("/dashboard/overview", dashboardOverviewSchema);
    },
    searchIntelligence(_requestBody) {
      throw new Error(
        "searchIntelligence is not supported by createClient() when targeting the core API. " +
          "Use createPlatformClient() from @/lib/platform-client instead.",
      );
    },
    listCases(options) {
      const query = new URLSearchParams();
      if (options?.limit) query.set("limit", String(options.limit));
      if (options?.status) query.set("status", options.status);
      if (options?.priority) query.set("priority", options.priority);
      if (options?.queue) query.set("queue", options.queue);
      if (options?.due_date) query.set("due_date", options.due_date);

      const queryString = query.toString();
      const path = queryString ? `/cases?${queryString}` : "/cases";
      return request(path, casesResponseSchema);
    },
    getCase(id) {
      return request(`/cases/${id}`, caseDetailSchema);
    },
    getTaxonomy() {
      return request("/taxonomy", taxonomyResponseSchema);
    },
    getAnalyticsOverview() {
      return request("/analytics/overview", analyticsOverviewSchema);
    },
    async listDossiers(options) {
      const payload = dossierListRequestSchema.parse(options ?? {});
      const query = new URLSearchParams({
        status: payload.status,
        limit: String(payload.limit),
        include_manifest: String(payload.includeManifest),
      });
      const path = `/reports/dossiers?${query.toString()}`;
      const response = await request(path, dossierListWireResponseSchema);
      return {
        count: response.count,
        items: response.items.map(normalizeDossierRecord),
      } satisfies DossierListResponse;
    },
    verifyDossier(planId) {
      const value = planIdSchema.parse(planId);
      const encoded = encodeURIComponent(value);
      return request(
        `/reports/dossiers/${encoded}/verify`,
        dossierVerificationSchema,
        {
          method: "POST",
        },
      );
    },
    detokenize(token, caseId) {
      const payload = { token, caseId };
      return request("/tokenization/detokenize", detokenizeResponseSchema, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Re-export mock client from fixtures (test-only).
// Production code must NOT import createMockClient; use createClient instead.
// ---------------------------------------------------------------------------
export { createMockClient } from "./__fixtures__/index";

export {
  analyticsOverviewSchema,
  casesResponseSchema,
  dashboardOverviewSchema,
  dossierListRequestSchema,
  searchRequestSchema,
  searchResponseSchema,
  taxonomyResponseSchema,
};

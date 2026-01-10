import { z } from "zod";
import {
  ScamIntent,
  DeliveryChannel,
  SocialEngineeringTechnique,
  RequestedAction,
  ClaimedPersona,
} from "../../../types/taxonomy";

const scoredLabelSchema = z.object({
  label: z.string(),
  confidence: z.number().min(0).max(1),
  explanation: z.string().optional().nullable(),
});

export type ScoredLabel = z.infer<typeof scoredLabelSchema>;

const fraudClassificationResultSchema = z.object({
  intent: z.array(scoredLabelSchema),
  channel: z.array(scoredLabelSchema),
  techniques: z.array(scoredLabelSchema),
  actions: z.array(scoredLabelSchema),
  persona: z.array(scoredLabelSchema),
  explanation: z.string().optional().nullable(),
  few_shot_examples: z.array(z.record(z.unknown())).optional(),
  risk_score: z.number().min(0).max(100),
  taxonomy_version: z.string(),
});

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
export type SearchEntityFilter = z.infer<typeof searchEntityFilterSchema>;
export type SearchTimeRange = z.infer<typeof searchTimeRangeSchema>;

const searchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  snippet: z.string(),
  source: z.string(),
  tags: z.array(z.string()),
  classification: fraudClassificationResultSchema.optional(),
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
  status: z.enum(["new", "active", "blocked", "awaiting-input", "closed"]),
  updatedAt: z.string(),
  assignee: z.string(),
  queue: z.string(),
  tags: z.array(z.string()),
  classification: fraudClassificationResultSchema.optional(),
  progress: z.number().min(0).max(100),
  dueAt: z.string().nullable(),
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

const dossierVerificationArtifactWireSchema = z.object({
  label: z.string(),
  path: z.string().nullable().optional(),
  expected_hash: z.string().nullable().optional(),
  actual_hash: z.string().nullable().optional(),
  exists: z.boolean().optional(),
  matches: z.boolean().optional(),
  size_bytes: z.number().nullable().optional(),
  error: z.string().nullable().optional(),
});

type DossierVerificationArtifactWire = z.infer<
  typeof dossierVerificationArtifactWireSchema
>;

export type DossierVerificationArtifact = {
  label: string;
  path: string | null;
  expectedHash: string | null;
  actualHash: string | null;
  exists: boolean;
  matches: boolean;
  sizeBytes: number | null;
  error: string | null;
};

function normalizeVerificationArtifact(
  artifact: DossierVerificationArtifactWire,
): DossierVerificationArtifact {
  return {
    label: artifact.label,
    path: artifact.path ?? null,
    expectedHash: artifact.expected_hash ?? null,
    actualHash: artifact.actual_hash ?? null,
    exists: Boolean(artifact.exists),
    matches: Boolean(artifact.matches),
    sizeBytes: artifact.size_bytes ?? null,
    error: artifact.error ?? null,
  } satisfies DossierVerificationArtifact;
}

const dossierVerificationWireSchema = z.object({
  plan_id: z.string(),
  algorithm: z.string(),
  warnings: z.array(z.string()).optional(),
  missing_count: z.number().int(),
  mismatch_count: z.number().int(),
  all_verified: z.boolean(),
  artifacts: z.array(dossierVerificationArtifactWireSchema),
});

type DossierVerificationWire = z.infer<typeof dossierVerificationWireSchema>;

export type DossierVerificationReport = {
  planId: string;
  algorithm: string;
  warnings: string[];
  missingCount: number;
  mismatchCount: number;
  allVerified: boolean;
  artifacts: DossierVerificationArtifact[];
};

function normalizeDossierVerification(
  payload: DossierVerificationWire,
): DossierVerificationReport {
  return {
    planId: payload.plan_id,
    algorithm: payload.algorithm,
    warnings: payload.warnings ?? [],
    missingCount: payload.missing_count,
    mismatchCount: payload.mismatch_count,
    allVerified: payload.all_verified,
    artifacts: payload.artifacts.map(normalizeVerificationArtifact),
  } satisfies DossierVerificationReport;
}

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

export interface I4GClient {
  getDashboardOverview(): Promise<DashboardOverview>;
  searchIntelligence(request: SearchRequest): Promise<SearchResponse>;
  listCases(): Promise<CasesResponse>;
  getTaxonomy(): Promise<TaxonomyResponse>;
  getAnalyticsOverview(): Promise<AnalyticsOverview>;
  listDossiers(options?: DossierListOptions): Promise<DossierListResponse>;
  verifyDossier(planId: string): Promise<DossierVerificationReport>;
  detokenize(token: string, caseId?: string): Promise<DetokenizeResponse>;
}

const detokenizeResponseSchema = z.object({
  token: z.string(),
  prefix: z.string(),
  canonical_value: z.string(),
  pepper_version: z.string(),
  case_id: z.string().nullable().optional(),
  detector: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
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
    searchIntelligence(requestBody) {
      const payload = searchRequestSchema.parse(requestBody);
      return request("/search", searchResponseSchema, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    listCases() {
      return request("/cases", casesResponseSchema);
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
        dossierVerificationWireSchema,
        {
          method: "POST",
        },
      ).then(normalizeDossierVerification);
    },
    detokenize(token, caseId) {
      const payload = { token, case_id: caseId };
      return request("/tokenization/detokenize", detokenizeResponseSchema, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  };
}

function toMillis(section: string) {
  return section.length * 9 + 42;
}

const mockDashboardData: DashboardOverview = {
  metrics: [
    {
      label: "Active investigations",
      value: "24",
      change: "+12% vs last week",
    },
    {
      label: "New leads this week",
      value: "68",
      change: "+5 sourced automatically",
    },
    {
      label: "Cases at risk",
      value: "6",
      change: "Need follow-up within 24h",
    },
    {
      label: "Policy exceptions",
      value: "3",
      change: "Escalations pending",
    },
  ],
  alerts: [
    {
      id: "alert-1",
      title: "Potential crypto scam network detected",
      detail: "Signal strength 0.92 · Cross-border pattern",
      time: "5m ago",
      variant: "danger",
    },
    {
      id: "alert-2",
      title: "Two cases awaiting legal review",
      detail: "Queue length exceeds SLA",
      time: "22m ago",
      variant: "warning",
    },
    {
      id: "alert-3",
      title: "Intake automation succeeded",
      detail: "14 forms processed with 98% confidence",
      time: "1h ago",
      variant: "success",
    },
  ],
  activity: [
    {
      id: "activity-1",
      title: "Case #482 reassigned to Policy Team",
      actor: "by J. Alvarez",
      when: "2m ago",
    },
    {
      id: "activity-2",
      title: "Generated risk assessment for Group-7",
      actor: "automated",
      when: "18m ago",
    },
    {
      id: "activity-3",
      title: "Uploaded customs data bundle",
      actor: "by A. Chen",
      when: "44m ago",
    },
  ],
  reminders: [
    {
      id: "reminder-1",
      text: "Schedule next coordination call with partner NGOs.",
      category: "coordination",
    },
    {
      id: "reminder-2",
      text: "Confirm legal review for three escalated dossiers.",
      category: "legal",
    },
    {
      id: "reminder-3",
      text: "Update geographic coverage map with customs data.",
      category: "data",
    },
  ],
};

const mockSearchResults: SearchResult[] = [
  {
    id: "result-1",
    title: "Crypto wallet cluster links Pattern-3 to flagged exchange",
    snippet:
      "Blockchain analysis from 12 Oct indicates Pattern-3 rerouted funds through Exchange X. Discrepancies match known pig-butchering profile.",
    source: "blockchain",
    tags: ["crypto-scam", "pattern-3", "exchange-x"],
    score: 0.92,
    occurredAt: "2025-11-18T13:04:00Z",
    confidence: 0.91,
  },
  {
    id: "result-2",
    title: "Chatter spike referencing new recruitment tactic",
    snippet:
      "Forum thread translated from Serbian discusses incentives offered to vulnerable populations in border towns.",
    source: "open-source",
    tags: ["recruitment", "border", "serbia"],
    score: 0.88,
    occurredAt: "2025-11-17T21:12:00Z",
    confidence: 0.87,
  },
  {
    id: "result-3",
    title: "NGO intake form flags underage labor risk",
    snippet:
      "Caseworker submitted verified statement from shelter partner documenting suspicious movement through warehouse district.",
    source: "intake",
    tags: ["child-labor", "warehouse", "ngo"],
    score: 0.85,
    occurredAt: "2025-11-17T16:33:00Z",
    confidence: 0.94,
  },
  {
    id: "result-4",
    title: "Financial transfer pattern aligns with prior investment fraud ring",
    snippet:
      "Clustered transfers originating from shell companies cross-referenced with FinCEN alert #5815.",
    source: "financial",
    tags: ["finance", "shell", "fincen"],
    score: 0.81,
    occurredAt: "2025-11-16T09:42:00Z",
    confidence: 0.83,
  },
  {
    id: "result-5",
    title: "Airbnb reviews indicate possible safehouse turnover",
    snippet:
      "Automated model flagged anomalous reservations with single-night stays and repeated burner accounts.",
    source: "open-source",
    tags: ["safehouse", "lodging", "pattern"],
    score: 0.79,
    occurredAt: "2025-11-15T19:58:00Z",
    confidence: 0.8,
  },
];

const mockFacets: SearchFacet[] = [
  {
    field: "source",
    label: "Sources",
    options: [
      { value: "customs", count: 4 },
      { value: "intake", count: 8 },
      { value: "open-source", count: 12 },
      { value: "financial", count: 5 },
    ],
  },
  {
    field: "taxonomy",
    label: "Taxonomy",
    options: [
      { value: "crypto-scam", count: 14 },
      { value: "romance-scam", count: 6 },
      { value: "pattern-3", count: 4 },
      { value: "finance", count: 5 },
    ],
  },
];

const mockCasesResponse: CasesResponse = {
  summary: {
    active: 18,
    dueToday: 4,
    pendingReview: 7,
    escalations: 3,
  },
  cases: [
    {
      id: "case-482",
      title: "Pattern-3 cross-border crypto investigation",
      priority: "critical",
      status: "active",
      updatedAt: "2025-11-19T08:41:00Z",
      assignee: "J. Alvarez",
      queue: "Rapid Response",
      tags: ["crypto-scam", "pattern-3", "cross-border"],
      progress: 68,
      dueAt: "2025-11-21T17:00:00Z",
    },
    {
      id: "case-417",
      title: "Warehouse labor exploitation probe",
      priority: "high",
      status: "awaiting-input",
      updatedAt: "2025-11-18T15:20:00Z",
      assignee: "A. Chen",
      queue: "Policy Review",
      tags: ["labor", "warehouse", "child-labor"],
      progress: 42,
      dueAt: "2025-11-22T12:00:00Z",
    },
    {
      id: "case-399",
      title: "Financial facilitation cluster",
      priority: "medium",
      status: "active",
      updatedAt: "2025-11-18T11:05:00Z",
      assignee: "M. Singh",
      queue: "Financial Intelligence",
      tags: ["finance", "shell", "group-7"],
      progress: 54,
      dueAt: null,
    },
    {
      id: "case-350",
      title: "NGO intake triage backlog",
      priority: "high",
      status: "blocked",
      updatedAt: "2025-11-17T18:47:00Z",
      assignee: "S. Patel",
      queue: "NGO Coordination",
      tags: ["intake", "triage"],
      progress: 31,
      dueAt: "2025-11-20T10:00:00Z",
    },
    {
      id: "case-311",
      title: "Supplier audit follow-up",
      priority: "low",
      status: "active",
      updatedAt: "2025-11-16T09:18:00Z",
      assignee: "D. Rivera",
      queue: "Compliance",
      tags: ["audit", "supplier"],
      progress: 74,
      dueAt: null,
    },
  ],
  queues: [
    {
      id: "queue-rapid-response",
      name: "Rapid Response",
      description: "Emergent escalations requiring 24h turnaround",
      count: 5,
    },
    {
      id: "queue-policy",
      name: "Policy Review",
      description: "Cases pending adjudication by policy team",
      count: 7,
    },
    {
      id: "queue-finance",
      name: "Financial Intelligence",
      description: "Cross-border payment analysis and tracing",
      count: 4,
    },
    {
      id: "queue-ngo",
      name: "NGO Coordination",
      description: "Partner intake triage and follow-up",
      count: 6,
    },
  ],
};

const mockTaxonomyResponse: TaxonomyResponse = {
  version: "1.0",
  steward: "Policy & Standards Team",
  updatedAt: "2026-01-10T12:00:00Z",
  axes: [
    {
      id: "intents",
      label: "Intents",
      description: "Primary fraud intents",
      items: [
        {
          code: "INTENT.IMPOSTER",
          label: "Imposter",
          description: "Pretending to be someone else",
          examples: [],
        },
      ],
    },
  ],
};

const mockAnalyticsResponse: AnalyticsOverview = {
  metrics: [
    {
      id: "metric-detection-rate",
      label: "Detection rate",
      value: "87%",
      change: "+3.2 pts vs last month",
      trend: "up",
    },
    {
      id: "metric-time-to-action",
      label: "Median time to action",
      value: "9.4h",
      change: "-1.1h vs last week",
      trend: "down",
    },
    {
      id: "metric-proactive",
      label: "Proactive interventions",
      value: "42",
      change: "+6 vs last week",
      trend: "up",
    },
    {
      id: "metric-sla",
      label: "SLA adherence",
      value: "94%",
      change: "-2 pts vs target",
      trend: "down",
    },
  ],
  detectionRateSeries: [
    { label: "Mon", value: 79 },
    { label: "Tue", value: 82 },
    { label: "Wed", value: 85 },
    { label: "Thu", value: 88 },
    { label: "Fri", value: 87 },
  ],
  pipelineBreakdown: [
    { label: "Intake", value: 34 },
    { label: "Data fusion", value: 26 },
    { label: "Human review", value: 19 },
    { label: "Policy", value: 12 },
    { label: "Action", value: 9 },
  ],
  geographyBreakdown: [
    { region: "North America", value: 28 },
    { region: "Europe", value: 22 },
    { region: "LATAM", value: 18 },
    { region: "Asia-Pacific", value: 25 },
    { region: "Africa", value: 9 },
  ],
  weeklyIncidents: [
    { week: "W32", incidents: 18, interventions: 12 },
    { week: "W33", incidents: 21, interventions: 15 },
    { week: "W34", incidents: 25, interventions: 19 },
    { week: "W35", incidents: 24, interventions: 18 },
    { week: "W36", incidents: 27, interventions: 20 },
  ],
};

const mockDossiers: DossierRecord[] = [
  {
    planId: "dossier-nyc-20251115-001",
    status: "completed",
    queuedAt: "2025-11-15T08:05:00Z",
    updatedAt: "2025-11-15T12:40:00Z",
    warnings: [],
    error: null,
    payload: {
      jurisdiction: "NYC-DOJ",
      jurisdiction_key: "nyc",
      total_loss_usd: 245000,
      cases: ["case-482", "case-417"],
    },
    manifestPath: "/data/reports/dossiers/dossier-nyc-20251115-001.json",
    manifest: {
      plan_id: "dossier-nyc-20251115-001",
      bundles: [
        {
          label: "Investigative bundle",
          path: "/drive/nyc/dossier-nyc-20251115-001.pdf",
        },
      ],
      signature_manifest: {
        path: "/data/reports/dossiers/dossier-nyc-20251115-001.signatures.json",
      },
    },
    signatureManifestPath:
      "/data/reports/dossiers/dossier-nyc-20251115-001.signatures.json",
    signatureManifest: {
      algorithm: "sha256",
      generated_at: "2025-11-15T12:00:00Z",
      warnings: [],
      artifacts: [
        {
          label: "Summary PDF",
          path: "/drive/nyc/dossier-nyc-20251115-001.pdf",
          hash: "6f50b2c5",
          size_bytes: 245760,
        },
        {
          label: "Manifest JSON",
          path: "/data/reports/dossiers/dossier-nyc-20251115-001.json",
          hash: "92ad3c10",
          size_bytes: 4096,
        },
      ],
    },
    artifactWarnings: [],
    downloads: {
      local: {
        manifest: "/data/reports/dossiers/dossier-nyc-20251115-001.json",
        markdown: "/data/reports/dossiers/dossier-nyc-20251115-001.md",
        pdf: "/drive/nyc/dossier-nyc-20251115-001.pdf",
        html: "/data/reports/dossiers/dossier-nyc-20251115-001.html",
        signatureManifest:
          "/data/reports/dossiers/dossier-nyc-20251115-001.signatures.json",
      },
      remote: [
        {
          label: "Shared Drive bundle",
          remoteRef: "https://drive.google.com/file/d/nyc-20251115-001/view",
          hash: "6f50b2c5",
          algorithm: "sha256",
          sizeBytes: 245760,
        },
      ],
    },
  },
  {
    planId: "dossier-la-20251116-002",
    status: "pending",
    queuedAt: "2025-11-16T09:10:00Z",
    updatedAt: "2025-11-16T09:10:00Z",
    warnings: ["Awaiting signature manifest"],
    error: null,
    payload: {
      jurisdiction: "CA-AGO",
      jurisdiction_key: "california",
      total_loss_usd: 145000,
      cases: ["case-399"],
    },
    manifestPath: null,
    manifest: null,
    signatureManifestPath: null,
    signatureManifest: null,
    artifactWarnings: [
      "Manifest missing for plan dossier-la-20251116-002 at /data/reports/dossiers/dossier-la-20251116-002.json",
    ],
    downloads: {
      local: {
        manifest: null,
        markdown: null,
        pdf: null,
        html: null,
        signatureManifest: null,
      },
      remote: [],
    },
  },
];

const mockVerificationReports: Record<string, DossierVerificationReport> = {
  "dossier-nyc-20251115-001": {
    planId: "dossier-nyc-20251115-001",
    algorithm: "sha256",
    warnings: [],
    missingCount: 0,
    mismatchCount: 0,
    allVerified: true,
    artifacts: [
      {
        label: "Summary PDF",
        path: "/drive/nyc/dossier-nyc-20251115-001.pdf",
        expectedHash: "6f50b2c5",
        actualHash: "6f50b2c5",
        exists: true,
        matches: true,
        sizeBytes: 245760,
        error: null,
      },
      {
        label: "Manifest JSON",
        path: "/data/reports/dossiers/dossier-nyc-20251115-001.json",
        expectedHash: "92ad3c10",
        actualHash: "92ad3c10",
        exists: true,
        matches: true,
        sizeBytes: 4096,
        error: null,
      },
    ],
  },
  "dossier-la-20251116-002": {
    planId: "dossier-la-20251116-002",
    algorithm: "sha256",
    warnings: ["Signature manifest unavailable"],
    missingCount: 1,
    mismatchCount: 0,
    allVerified: false,
    artifacts: [
      {
        label: "Summary PDF",
        path: null,
        expectedHash: null,
        actualHash: null,
        exists: false,
        matches: false,
        sizeBytes: null,
        error: "Artifact not generated",
      },
    ],
  },
};

export function createMockClient(): I4GClient {
  return {
    async getDashboardOverview() {
      return mockDashboardData;
    },
    async searchIntelligence(request) {
      const payload = searchRequestSchema.parse(request);
      const normalizedQuery = payload.query.trim().toLowerCase();
      const normalizedSources = new Set(
        payload.sources?.map((s) => s.toLowerCase()) ?? [],
      );
      const normalizedTaxonomy = new Set(
        payload.taxonomy?.map((t) => t.toLowerCase()) ?? [],
      );

      let filtered = mockSearchResults;

      if (normalizedQuery) {
        filtered = filtered.filter((item) => {
          const haystack =
            `${item.title} ${item.snippet} ${item.tags.join(" ")}`.toLowerCase();
          return haystack.includes(normalizedQuery);
        });
      }

      if (normalizedSources.size) {
        filtered = filtered.filter((item) =>
          normalizedSources.has(item.source.toLowerCase()),
        );
      }

      if (normalizedTaxonomy.size) {
        filtered = filtered.filter((item) =>
          item.tags.some((tag) => normalizedTaxonomy.has(tag.toLowerCase())),
        );
      }

      const total = filtered.length;
      const pageSize = payload.pageSize ?? 10;
      const page = payload.page ?? 1;
      const start = (page - 1) * pageSize;
      const pageResults = filtered.slice(start, start + pageSize);

      return {
        results: pageResults,
        stats: {
          query: payload.query,
          total,
          took: toMillis(payload.query),
          page,
          pageSize,
        },
        facets: mockFacets,
        suggestions: [
          "group-7 network",
          "safehouse turnover",
          "intake backlog",
        ],
      } satisfies SearchResponse;
    },
    async listCases() {
      return mockCasesResponse;
    },
    async getTaxonomy() {
      return mockTaxonomyResponse;
    },
    async getAnalyticsOverview() {
      return mockAnalyticsResponse;
    },
    async listDossiers(options) {
      const payload = dossierListRequestSchema.parse(options ?? {});
      const normalizedStatus = payload.status.toLowerCase();
      let items = mockDossiers;
      if (normalizedStatus !== "all") {
        items = items.filter(
          (item) =>
            item.status === normalizedStatus || item.status === payload.status,
        );
      }
      const sliced = items
        .slice(0, payload.limit)
        .map((item) =>
          payload.includeManifest ? item : { ...item, manifest: null },
        );
      return {
        count: sliced.length,
        items: sliced,
      } satisfies DossierListResponse;
    },
    async verifyDossier(planId) {
      const key = planIdSchema.parse(planId);
      return (
        mockVerificationReports[key] ?? {
          planId: key,
          algorithm: "sha256",
          warnings: ["Mock data does not include this plan"],
          missingCount: 1,
          mismatchCount: 0,
          allVerified: false,
          artifacts: [],
        }
      );
    },
    async detokenize(token, caseId) {
      return {
        token,
        prefix: token.split("-")[0] || "UNK",
        canonical_value: `[REVEALED: ${token}]`,
        pepper_version: "mock-v1",
        case_id: caseId || null,
        detector: "mock-detector",
        created_at: new Date().toISOString(),
      };
    },
  };
}

export {
  analyticsOverviewSchema,
  casesResponseSchema,
  dashboardOverviewSchema,
  searchRequestSchema,
  searchResponseSchema,
  taxonomyResponseSchema,
};

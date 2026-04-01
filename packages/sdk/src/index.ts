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
    "escalated",
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

export const caseInvestigationSummarySchema = z.object({
  scanId: z.string(),
  url: z.string(),
  normalizedUrl: z.string().nullable().optional(),
  status: z.string(),
  riskScore: z.number().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  triggerType: z.string(),
  linkedAt: z.string(),
});
export type CaseInvestigationSummary = z.infer<
  typeof caseInvestigationSummarySchema
>;

export const caseDetailSchema = caseSummarySchema.extend({
  description: z.string().optional(),
  artifacts: z.array(caseArtifactSchema),
  timeline: z.array(caseTimelineEventSchema),
  graphNodes: z.array(caseGraphNodeSchema),
  graphLinks: z.array(caseGraphLinkSchema),
  investigations: z.array(caseInvestigationSummarySchema).optional(),
});
export type CaseDetail = z.infer<typeof caseDetailSchema>;

export const linkedCaseSummarySchema = z.object({
  caseId: z.string(),
  dataset: z.string(),
  classification: z.string().nullable().optional(),
  status: z.string(),
  triggerType: z.string(),
  linkedAt: z.string(),
});
export type LinkedCaseSummary = z.infer<typeof linkedCaseSummarySchema>;

export const caseActivitySchema = z.object({
  type: z.string(),
  status: z.string(),
  startedAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  progress: z.number().nullable().optional(),
  total: z.number().nullable().optional(),
  scanId: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  riskScore: z.number().nullable().optional(),
});
export type CaseActivity = z.infer<typeof caseActivitySchema>;

export const caseActivityResponseSchema = z.object({
  caseId: z.string(),
  activities: z.array(caseActivitySchema),
  hasRunning: z.boolean(),
});
export type CaseActivityResponse = z.infer<typeof caseActivityResponseSchema>;

export const caseInvestigateRequestSchema = z.object({
  url: z.string(),
  force: z.boolean().optional(),
});
export type CaseInvestigateRequest = z.infer<
  typeof caseInvestigateRequestSchema
>;

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
  // Intelligence (S2-15)
  getEntities(options?: EntityListOptions): Promise<EntityListResponse>;
  getEntity(
    entityType: string,
    canonicalValue: string,
  ): Promise<EntityStats & { campaigns: { id: string; name: string }[] }>;
  getIndicators(options?: IndicatorListOptions): Promise<IndicatorListResponse>;
  getIndicator(indicatorId: string): Promise<IndicatorStats>;
  getDashboardWidgets(): Promise<DashboardWidgets>;
  getEntityActivity(
    entityType: string,
    canonicalValue: string,
  ): Promise<{ week: string; caseCount: number }[]>;
  getEntityNeighbors(
    entityType: string,
    canonicalValue: string,
  ): Promise<NeighborGraph>;
  // Exports (S2-16)
  exportEntities(options?: {
    fmt?: string;
    entityType?: string;
    status?: string;
  }): Promise<Blob>;
  exportIndicators(options?: {
    fmt?: string;
    category?: string;
    unmask?: boolean;
  }): Promise<Blob>;
  // Impact Dashboard (S3-19)
  getImpactDashboard(
    options?: ImpactDashboardOptions,
  ): Promise<ImpactDashboard>;
  getImpactLoss(): Promise<TaxonomyLossItem[]>;
  getDetectionVelocity(): Promise<DetectionVelocityPoint[]>;
  getPipelineFunnel(): Promise<PipelineFunnelStage[]>;
  getCumulativeIndicators(): Promise<CumulativeIndicatorPoint[]>;
  // Campaign Intelligence (S3-20)
  listThreatCampaigns(
    options?: CampaignListOptions,
  ): Promise<ThreatCampaignList>;
  getThreatCampaign(campaignId: string): Promise<ThreatCampaignDetail>;
  getCampaignTimeline(campaignId: string): Promise<CampaignTimelinePoint[]>;
  getCampaignGraph(campaignId: string): Promise<GraphPayload>;
  manageCampaign(
    campaignId: string,
    action: string,
    payload?: Record<string, unknown>,
  ): Promise<{ status: string }>;
  // Reports (S3-20)
  generateReport(
    template: string,
    scope: string,
    tlp?: string,
  ): Promise<{ reportId: string; status: string }>;
  listReports(options?: ReportLibraryOptions): Promise<ReportLibraryResponse>;
  // LEA Referrals (S3-20)
  getLeaSuggestions(limit?: number): Promise<LeaSuggestionResponse>;
  // Sprint 4: Network Graph
  getIntelligenceGraph(options: {
    seed: string;
    seedType?: string;
    hops?: number;
    entityTypes?: string;
    limit?: number;
  }): Promise<GraphPayload>;
  exportGraph(seed: string, fmt?: string): Promise<Blob>;
  // Sprint 4: Timeline
  getTimeline(options?: {
    period?: string;
    granularity?: string;
  }): Promise<TimelineResponse>;
  // Sprint 4: Taxonomy & Geography
  getTaxonomySankey(period?: string): Promise<SankeyResponse>;
  getTaxonomyHeatmap(
    period?: string,
    granularity?: string,
  ): Promise<HeatmapCell[]>;
  getTaxonomyTrend(
    period?: string,
    categories?: string,
  ): Promise<TaxonomyTrendPoint[]>;
  getGeographySummary(period?: string): Promise<GeographySummary[]>;
  getGeographyDetail(
    country: string,
    period?: string,
  ): Promise<CountryDetailResponse>;
  // Sprint 4: Annotations
  createAnnotation(
    targetType: string,
    targetId: string,
    content: string,
  ): Promise<Annotation>;
  listAnnotations(
    targetType?: string,
    targetId?: string,
  ): Promise<Annotation[]>;
  updateAnnotation(annotationId: string, content: string): Promise<Annotation>;
  deleteAnnotation(annotationId: string): Promise<{ deleted: boolean }>;
  // Sprint 4: Entity status & bulk actions
  updateEntityStatus(
    entityType: string,
    canonicalValue: string,
    status: string,
  ): Promise<{ entityType: string; canonicalValue: string; status: string }>;
  bulkEntityAction(
    entityIds: string[],
    action: string,
    options?: { tag?: string; status?: string },
  ): Promise<BulkActionResult>;
  // Sprint 5: Watchlist
  addToWatchlist(item: WatchlistItemInput): Promise<WatchlistItem>;
  listWatchlistItems(options?: {
    entityType?: string;
    limit?: number;
    offset?: number;
  }): Promise<WatchlistListResponse>;
  updateWatchlistItem(
    watchlistId: string,
    update: WatchlistUpdateInput,
  ): Promise<WatchlistItem>;
  removeFromWatchlist(watchlistId: string): Promise<{ deleted: boolean }>;
  getWatchlistAlerts(options?: {
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<WatchlistAlert[]>;
  markAlertRead(alertId: string): Promise<{ markedRead: boolean }>;
  markAllAlertsRead(): Promise<{ markedRead: number }>;
  // Sprint 5: Scheduled Reports
  createReportSchedule(schedule: ReportScheduleInput): Promise<ReportSchedule>;
  listReportSchedules(): Promise<ReportSchedule[]>;
  updateReportSchedule(
    scheduleId: string,
    update: Partial<ReportScheduleInput>,
  ): Promise<ReportSchedule>;
  deleteReportSchedule(scheduleId: string): Promise<{ deleted: boolean }>;
  // SSI Case Integration (Phase 3)
  getCaseActivity(caseId: string): Promise<CaseActivityResponse>;
  investigateCaseUrl(
    caseId: string,
    body: CaseInvestigateRequest,
  ): Promise<Record<string, unknown>>;
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

// ---------------------------------------------------------------------------
// Intelligence types (S2-14)
// ---------------------------------------------------------------------------

const entityStatSchema = z.object({
  entityType: z.string(),
  canonicalValue: z.string(),
  caseCount: z.number(),
  victimCount: z.number(),
  lossSum: z.number(),
  lossCurrency: z.string().default("USD"),
  maxRiskScore: z.number(),
  avgRiskScore: z.number(),
  firstSeenAt: z.string().nullable().optional(),
  lastSeenAt: z.string().nullable().optional(),
  status: z.string(),
  campaignIds: z.array(z.string()).nullable().optional(),
  topClassifications: z.unknown().nullable().optional(),
  ecxSubmitted: z.boolean().optional(),
  ecxHit: z.boolean().optional(),
  purgeStatus: z.string().nullable().optional(),
  updatedAt: z.string().optional(),
});

export type EntityStats = z.infer<typeof entityStatSchema>;

const entityListResponseSchema = z.object({
  items: z.array(entityStatSchema.passthrough()),
  count: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export type EntityListResponse = z.infer<typeof entityListResponseSchema>;

const indicatorStatSchema = z.object({
  indicatorId: z.string(),
  category: z.string(),
  item: z.string().nullable().optional(),
  type: z.string(),
  indicatorValue: z.string(),
  caseCount: z.number(),
  lossSum: z.number(),
  firstSeenAt: z.string().nullable().optional(),
  lastSeenAt: z.string().nullable().optional(),
  maxRiskScore: z.number(),
  ecxStatus: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type IndicatorStats = z.infer<typeof indicatorStatSchema>;

const indicatorListResponseSchema = z.object({
  items: z.array(indicatorStatSchema.passthrough()),
  count: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export type IndicatorListResponse = z.infer<typeof indicatorListResponseSchema>;

const campaignStatSchema = z.object({
  campaignId: z.string(),
  caseCount: z.number(),
  indicatorCount: z.number(),
  entityTypes: z.unknown().nullable().optional(),
  lossSum: z.number(),
  victimCount: z.number(),
  riskScore: z.number(),
  taxonomyRollup: z.unknown().nullable().optional(),
  firstCaseAt: z.string().nullable().optional(),
  lastCaseAt: z.string().nullable().optional(),
  status: z.string(),
  updatedAt: z.string().optional(),
});

export type CampaignStats = z.infer<typeof campaignStatSchema>;

const platformKpiSchema = z.object({
  periodType: z.string(),
  periodStart: z.string(),
  totalCases: z.number(),
  proactiveCases: z.number(),
  reactiveCases: z.number(),
  totalLoss: z.number(),
  newIndicators: z.number(),
  newEntities: z.number(),
  siteScans: z.number(),
  ecxSubmissions: z.number(),
  casesActioned: z.number(),
  medianActionHours: z.number().nullable().optional(),
  updatedAt: z.string().optional(),
});

export type PlatformKpis = z.infer<typeof platformKpiSchema>;

const graphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  entityType: z.string(),
  caseCount: z.number(),
  riskScore: z.number(),
  clusterId: z.number().optional(),
  data: z.record(z.unknown()).optional(),
});

const graphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  weight: z.number(),
  edgeType: z.string(),
});

const clusterSummarySchema = z.object({
  clusterId: z.number(),
  nodeCount: z.number(),
  primaryEntityType: z.string(),
  totalCases: z.number(),
  avgRiskScore: z.number(),
});

export type ClusterSummary = z.infer<typeof clusterSummarySchema>;

const graphPayloadSchema = z.object({
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
  nodeCount: z.number().optional(),
  edgeCount: z.number().optional(),
  layout: z.record(z.object({ x: z.number(), y: z.number() })).optional(),
  clusters: z.array(clusterSummarySchema).optional(),
});

export type GraphNode = z.infer<typeof graphNodeSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;
export type GraphPayload = z.infer<typeof graphPayloadSchema>;

// ---------------------------------------------------------------------------
// Watchlist types (S5-07)
// ---------------------------------------------------------------------------

const watchlistItemSchema = z.object({
  watchlistId: z.string(),
  entityType: z.string(),
  canonicalValue: z.string(),
  alertOnNewCase: z.boolean(),
  alertOnLossIncrease: z.boolean(),
  lossThreshold: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  createdBy: z.string(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export type WatchlistItem = z.infer<typeof watchlistItemSchema>;

export interface WatchlistItemInput {
  entityType: string;
  canonicalValue: string;
  alertOnNewCase?: boolean;
  alertOnLossIncrease?: boolean;
  lossThreshold?: number | null;
  note?: string | null;
}

export interface WatchlistUpdateInput {
  alertOnNewCase?: boolean;
  alertOnLossIncrease?: boolean;
  lossThreshold?: number | null;
  note?: string | null;
}

const watchlistListResponseSchema = z.object({
  items: z.array(watchlistItemSchema),
  count: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export type WatchlistListResponse = z.infer<typeof watchlistListResponseSchema>;

const watchlistAlertSchema = z.object({
  alertId: z.string(),
  watchlistId: z.string(),
  alertType: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  data: z.record(z.unknown()).nullable().optional(),
  createdAt: z.string().nullable().optional(),
});

export type WatchlistAlert = z.infer<typeof watchlistAlertSchema>;

// ---------------------------------------------------------------------------
// Scheduled Report types (S5-15)
// ---------------------------------------------------------------------------

const reportScheduleSchema = z.object({
  scheduleId: z.string(),
  template: z.string(),
  cadence: z.string(),
  scope: z.record(z.unknown()).nullable().optional(),
  options: z.record(z.unknown()).nullable().optional(),
  recipients: z.array(z.string()).nullable().optional(),
  isActive: z.boolean(),
  createdBy: z.string(),
  lastRunAt: z.string().nullable().optional(),
  nextRunAt: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export type ReportSchedule = z.infer<typeof reportScheduleSchema>;

export interface ReportScheduleInput {
  template: string;
  cadence: string;
  scope?: Record<string, unknown>;
  options?: Record<string, unknown>;
  recipients?: string[];
}

const dashboardWidgetsSchema = z.object({
  activeThreats: z.number(),
  newIndicators: z.number(),
  emergingCampaigns: z.number(),
  lossTrend: z.array(z.object({ period: z.string(), loss: z.number() })),
  sourceBreakdown: z.array(z.object({ source: z.string(), count: z.number() })),
});

export type DashboardWidgets = z.infer<typeof dashboardWidgetsSchema>;

const activityPointSchema = z.object({
  week: z.string(),
  caseCount: z.number(),
});

const neighborGraphSchema = z.object({
  seed: z.string(),
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      entityType: z.string(),
      caseCount: z.number(),
    }),
  ),
  edges: z.array(
    z.object({
      source: z.string(),
      target: z.string(),
      weight: z.number(),
      edgeType: z.string(),
    }),
  ),
});

export type NeighborGraph = z.infer<typeof neighborGraphSchema>;

// ---------------------------------------------------------------------------
// Impact Dashboard types (S3-19)
// ---------------------------------------------------------------------------

const kpiCardItemSchema = z.object({
  label: z.string(),
  value: z.union([z.number(), z.string()]),
  change: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
});

export type KpiCardItem = z.infer<typeof kpiCardItemSchema>;

const impactDashboardSchema = z.object({
  periodLabel: z.string().optional(),
  kpis: z.array(kpiCardItemSchema),
});

export type ImpactDashboard = z.infer<typeof impactDashboardSchema>;

const taxonomyLossItemSchema = z
  .object({
    label: z.string(),
    code: z.string().optional(),
    lossSum: z.number(),
    caseCount: z.number(),
  })
  .transform((d) => ({ ...d, code: d.code ?? "" }));

export type TaxonomyLossItem = z.infer<typeof taxonomyLossItemSchema>;

const detectionVelocityPointSchema = z.object({
  period: z.string(),
  proactive: z.number(),
  reactive: z.number(),
  total: z.number(),
});

export type DetectionVelocityPoint = z.infer<
  typeof detectionVelocityPointSchema
>;

const pipelineFunnelStageSchema = z.object({
  stage: z.string(),
  count: z.number(),
});

export type PipelineFunnelStage = z.infer<typeof pipelineFunnelStageSchema>;

const cumulativeIndicatorPointSchema = z.object({
  period: z.string(),
  bank: z.number(),
  crypto: z.number(),
  domain: z.number(),
  ip: z.number(),
  other: z.number(),
  total: z.number(),
});

export type CumulativeIndicatorPoint = z.infer<
  typeof cumulativeIndicatorPointSchema
>;

// ---------------------------------------------------------------------------
// Campaign Intelligence types (S3-20)
// ---------------------------------------------------------------------------

const threatCampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  caseCount: z.number(),
  indicatorCount: z.number(),
  lossSum: z.number(),
  victimCount: z.number(),
  riskScore: z.number(),
  firstCaseAt: z.string().nullable().optional(),
  lastCaseAt: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export type ThreatCampaign = z.infer<typeof threatCampaignSchema>;

const threatCampaignListSchema = z.object({
  items: z.array(threatCampaignSchema),
  count: z.number(),
});

export type ThreatCampaignList = z.infer<typeof threatCampaignListSchema>;

const threatCampaignDetailSchema = threatCampaignSchema.extend({
  cases: z.array(z.record(z.unknown())).optional(),
  entityTypes: z.array(z.string()).optional(),
  ssiLinks: z.array(z.record(z.unknown())).optional(),
});

export type ThreatCampaignDetail = z.infer<typeof threatCampaignDetailSchema>;

const campaignTimelinePointSchema = z.object({
  date: z.string(),
  count: z.number(),
});

export type CampaignTimelinePoint = z.infer<typeof campaignTimelinePointSchema>;

// Report types (S3-20)

const reportLibraryItemSchema = z.object({
  reportId: z.string(),
  template: z.string(),
  scope: z.string(),
  tlp: z.string(),
  status: z.string(),
  createdAt: z.string(),
  createdBy: z.string(),
});

export type ReportLibraryItem = z.infer<typeof reportLibraryItemSchema>;

const reportLibraryResponseSchema = z.object({
  items: z.array(reportLibraryItemSchema),
  count: z.number(),
});

export type ReportLibraryResponse = z.infer<typeof reportLibraryResponseSchema>;

// LEA Referral types (S3-20)

const leaSuggestionSchema = z.object({
  suggestionId: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  targetLabel: z.string(),
  reasons: z.array(z.string()),
  lossSum: z.number(),
  caseCount: z.number(),
  riskScore: z.number(),
  ecxCorroborated: z.boolean(),
});

export type LeaSuggestion = z.infer<typeof leaSuggestionSchema>;

const leaSuggestionResponseSchema = z.object({
  suggestions: z.array(leaSuggestionSchema),
  count: z.number(),
});

export type LeaSuggestionResponse = z.infer<typeof leaSuggestionResponseSchema>;

// ---------------------------------------------------------------------------
// Sprint 4: Timeline types
// ---------------------------------------------------------------------------

const timelineTrackSchema = z.object({
  track: z.string(),
  data: z.array(z.record(z.unknown())),
});

const timelineResponseSchema = z.object({
  tracks: z.array(timelineTrackSchema),
  granularity: z.string(),
});

export type TimelineTrack = z.infer<typeof timelineTrackSchema>;
export type TimelineResponse = z.infer<typeof timelineResponseSchema>;

// ---------------------------------------------------------------------------
// Sprint 4: Taxonomy types
// ---------------------------------------------------------------------------

const sankeyNodeSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    code: z.string().optional(),
    value: z.number(),
  })
  .transform((d) => ({ ...d, code: d.code ?? "" }));

const sankeyLinkSchema = z.object({
  source: z.string(),
  target: z.string(),
  value: z.number(),
});

const sankeyResponseSchema = z.object({
  nodes: z.array(sankeyNodeSchema),
  links: z.array(sankeyLinkSchema),
});

export type SankeyNode = z.infer<typeof sankeyNodeSchema>;
export type SankeyLink = z.infer<typeof sankeyLinkSchema>;
export type SankeyResponse = z.infer<typeof sankeyResponseSchema>;

const heatmapCellSchema = z
  .object({
    category: z.string(),
    categoryCode: z.string().optional(),
    period: z.string(),
    count: z.number(),
  })
  .transform((d) => ({ ...d, categoryCode: d.categoryCode ?? "" }));

export type HeatmapCell = z.infer<typeof heatmapCellSchema>;

const taxonomyTrendPointSchema = z
  .object({
    period: z.string(),
    category: z.string(),
    categoryCode: z.string().optional(),
    count: z.number(),
  })
  .transform((d) => ({ ...d, categoryCode: d.categoryCode ?? "" }));

export type TaxonomyTrendPoint = z.infer<typeof taxonomyTrendPointSchema>;

// ---------------------------------------------------------------------------
// Sprint 4: Geography types
// ---------------------------------------------------------------------------

const geographySummarySchema = z.object({
  country: z.string(),
  caseCount: z.number(),
  totalLoss: z.number(),
  victimCount: z.number(),
});

export type GeographySummary = z.infer<typeof geographySummarySchema>;

const countryDetailRecordSchema = z.object({
  caseId: z.string(),
  category: z.string().nullable().optional(),
  categoryCode: z.string().nullable().optional(),
  lossAmount: z.number(),
  createdAt: z.string().nullable().optional(),
});

const countryDetailResponseSchema = z.object({
  country: z.string(),
  totalCases: z.number(),
  totalLoss: z.number(),
  records: z.array(countryDetailRecordSchema),
});

export type CountryDetailRecord = z.infer<typeof countryDetailRecordSchema>;
export type CountryDetailResponse = z.infer<typeof countryDetailResponseSchema>;

// ---------------------------------------------------------------------------
// Sprint 4: Annotation types
// ---------------------------------------------------------------------------

const annotationSchema = z.object({
  annotationId: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  content: z.string(),
  author: z.string(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

export type Annotation = z.infer<typeof annotationSchema>;

// ---------------------------------------------------------------------------
// Sprint 4: Bulk action types
// ---------------------------------------------------------------------------

const bulkActionResultSchema = z.object({
  processed: z.number(),
  failed: z.number(),
  errors: z.array(z.string()),
});

export type BulkActionResult = z.infer<typeof bulkActionResultSchema>;

// ---------------------------------------------------------------------------
// Impact / Campaign / Report list options
// ---------------------------------------------------------------------------

export interface ImpactDashboardOptions {
  days?: number;
}

export interface CampaignListOptions {
  status?: string;
  limit?: number;
  offset?: number;
}

export interface ReportLibraryOptions {
  limit?: number;
  template?: string;
}

// ---------------------------------------------------------------------------
// Entity/Indicator list options
// ---------------------------------------------------------------------------

export interface EntityListOptions {
  entityType?: string;
  status?: string;
  minCaseCount?: number;
  minLoss?: number;
  orderBy?: string;
  descending?: boolean;
  limit?: number;
  offset?: number;
}

export interface IndicatorListOptions {
  category?: string;
  minCaseCount?: number;
  orderBy?: string;
  descending?: boolean;
  limit?: number;
  offset?: number;
}

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

  async function request<S extends z.ZodTypeAny>(
    path: string,
    schema: S,
    init?: RequestInit,
  ): Promise<z.infer<S>> {
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
    // Intelligence methods (S2-15)
    getEntities(options) {
      const query = new URLSearchParams();
      if (options?.entityType) query.set("entity_type", options.entityType);
      if (options?.status) query.set("status", options.status);
      if (options?.minCaseCount != null)
        query.set("min_case_count", String(options.minCaseCount));
      if (options?.minLoss != null)
        query.set("min_loss", String(options.minLoss));
      if (options?.orderBy) query.set("order_by", options.orderBy);
      if (options?.descending != null)
        query.set("descending", String(options.descending));
      if (options?.limit) query.set("limit", String(options.limit));
      if (options?.offset) query.set("offset", String(options.offset));
      const qs = query.toString();
      const path = qs
        ? `/intelligence/entities?${qs}`
        : "/intelligence/entities";
      return request(
        path,
        entityListResponseSchema as z.ZodSchema<EntityListResponse>,
      );
    },
    getEntity(entityType, canonicalValue) {
      const et = encodeURIComponent(entityType);
      const cv = encodeURIComponent(canonicalValue);
      return request(
        `/intelligence/entities/${et}/${cv}`,
        entityStatSchema.passthrough() as z.ZodSchema,
      );
    },
    getIndicators(options) {
      const query = new URLSearchParams();
      if (options?.category) query.set("category", options.category);
      if (options?.minCaseCount != null)
        query.set("min_case_count", String(options.minCaseCount));
      if (options?.orderBy) query.set("order_by", options.orderBy);
      if (options?.descending != null)
        query.set("descending", String(options.descending));
      if (options?.limit) query.set("limit", String(options.limit));
      if (options?.offset) query.set("offset", String(options.offset));
      const qs = query.toString();
      const path = qs
        ? `/intelligence/indicators?${qs}`
        : "/intelligence/indicators";
      return request(
        path,
        indicatorListResponseSchema as z.ZodSchema<IndicatorListResponse>,
      );
    },
    getIndicator(indicatorId) {
      return request(
        `/intelligence/indicators/${encodeURIComponent(indicatorId)}`,
        indicatorStatSchema.passthrough() as z.ZodSchema,
      );
    },
    getDashboardWidgets() {
      return request("/intelligence/dashboard", dashboardWidgetsSchema);
    },
    getEntityActivity(entityType, canonicalValue) {
      const et = encodeURIComponent(entityType);
      const cv = encodeURIComponent(canonicalValue);
      return request(
        `/intelligence/entities/${et}/${cv}/activity`,
        z.array(activityPointSchema),
      );
    },
    getEntityNeighbors(entityType, canonicalValue) {
      const et = encodeURIComponent(entityType);
      const cv = encodeURIComponent(canonicalValue);
      return request(
        `/intelligence/entities/${et}/${cv}/neighbors`,
        neighborGraphSchema as z.ZodSchema<NeighborGraph>,
      );
    },
    // Export methods (S2-16)
    async exportEntities(options) {
      const query = new URLSearchParams();
      if (options?.fmt) query.set("fmt", options.fmt);
      if (options?.entityType) query.set("entity_type", options.entityType);
      if (options?.status) query.set("status", options.status);
      const qs = query.toString();
      const path = qs ? `/exports/entities?${qs}` : "/exports/entities";

      const headers: Record<string, string> = {
        ...additionalHeaders,
      };
      if (apiKey) headers["X-API-KEY"] = apiKey;

      const response = await fetcher(buildUrl(baseUrl, path), { headers });
      if (!response.ok) {
        throw new I4GClientError(
          `Export failed: ${response.status}`,
          response.status,
        );
      }
      return response.blob();
    },
    async exportIndicators(options) {
      const query = new URLSearchParams();
      if (options?.fmt) query.set("fmt", options.fmt);
      if (options?.category) query.set("category", options.category);
      if (options?.unmask) query.set("unmask", "true");
      const qs = query.toString();
      const path = qs ? `/exports/indicators?${qs}` : "/exports/indicators";

      const headers: Record<string, string> = {
        ...additionalHeaders,
      };
      if (apiKey) headers["X-API-KEY"] = apiKey;

      const response = await fetcher(buildUrl(baseUrl, path), { headers });
      if (!response.ok) {
        throw new I4GClientError(
          `Export failed: ${response.status}`,
          response.status,
        );
      }
      return response.blob();
    },
    // Impact Dashboard (S3-19)
    getImpactDashboard(options) {
      const query = new URLSearchParams();
      if (options?.days) query.set("days", String(options.days));
      const qs = query.toString();
      const path = qs ? `/impact/dashboard?${qs}` : "/impact/dashboard";
      return request(path, impactDashboardSchema);
    },
    getImpactLoss() {
      return request(
        "/impact/loss-by-taxonomy",
        z.array(taxonomyLossItemSchema),
      );
    },
    getDetectionVelocity() {
      return request(
        "/impact/detection-velocity",
        z.array(detectionVelocityPointSchema),
      );
    },
    getPipelineFunnel() {
      return request(
        "/impact/pipeline-funnel",
        z.array(pipelineFunnelStageSchema),
      );
    },
    getCumulativeIndicators() {
      return request(
        "/impact/cumulative-indicators",
        z.array(cumulativeIndicatorPointSchema),
      );
    },
    // Campaign Intelligence (S3-20)
    listThreatCampaigns(options) {
      const query = new URLSearchParams();
      if (options?.status) query.set("status", options.status);
      if (options?.limit) query.set("limit", String(options.limit));
      if (options?.offset) query.set("offset", String(options.offset));
      const qs = query.toString();
      const path = qs
        ? `/intelligence/campaigns?${qs}`
        : "/intelligence/campaigns";
      return request(path, threatCampaignListSchema);
    },
    getThreatCampaign(campaignId) {
      return request(
        `/intelligence/campaigns/${encodeURIComponent(campaignId)}`,
        threatCampaignDetailSchema,
      );
    },
    getCampaignTimeline(campaignId) {
      return request(
        `/intelligence/campaigns/${encodeURIComponent(campaignId)}/timeline`,
        z.array(campaignTimelinePointSchema),
      );
    },
    getCampaignGraph(campaignId) {
      return request(
        `/intelligence/campaigns/${encodeURIComponent(campaignId)}/graph`,
        graphPayloadSchema,
      );
    },
    async manageCampaign(campaignId, action, payload) {
      const body = { action, ...payload };
      return request(
        `/intelligence/campaigns/${encodeURIComponent(campaignId)}/manage`,
        z.object({ status: z.string() }),
        { method: "POST", body: JSON.stringify(body) },
      );
    },
    // Reports (S3-20)
    async generateReport(template, scope, tlp) {
      const body: Record<string, string> = { template, scope };
      if (tlp) body.tlp = tlp;
      return request(
        "/reports/generate",
        z.object({ reportId: z.string(), status: z.string() }),
        { method: "POST", body: JSON.stringify(body) },
      );
    },
    listReports(options) {
      const query = new URLSearchParams();
      if (options?.limit) query.set("limit", String(options.limit));
      if (options?.template) query.set("template", options.template);
      const qs = query.toString();
      const path = qs ? `/reports/library?${qs}` : "/reports/library";
      return request(path, reportLibraryResponseSchema);
    },
    // LEA Referrals (S3-20)
    getLeaSuggestions(limit) {
      const query = new URLSearchParams();
      if (limit) query.set("limit", String(limit));
      const qs = query.toString();
      const path = qs
        ? `/intelligence/lea-suggestions?${qs}`
        : "/intelligence/lea-suggestions";
      return request(path, leaSuggestionResponseSchema);
    },
    // Sprint 4: Network Graph
    getIntelligenceGraph(options) {
      const query = new URLSearchParams();
      query.set("seed", options.seed);
      if (options.seedType) query.set("seed_type", options.seedType);
      if (options.hops) query.set("hops", String(options.hops));
      if (options.entityTypes) query.set("entity_types", options.entityTypes);
      if (options.limit) query.set("limit", String(options.limit));
      return request(
        `/intelligence/graph?${query}`,
        graphPayloadSchema as z.ZodSchema<GraphPayload>,
      );
    },
    async exportGraph(seed, fmt = "png") {
      const path = `/intelligence/graph/export?seed=${encodeURIComponent(seed)}&fmt=${fmt}`;
      const headers: Record<string, string> = {
        ...additionalHeaders,
      };
      if (apiKey) headers["X-API-KEY"] = apiKey;
      const res = await fetcher(buildUrl(baseUrl, path), {
        headers,
      });
      if (!res.ok) throw new I4GClientError("Graph export failed", res.status);
      return res.blob();
    },
    // Sprint 4: Timeline
    getTimeline(options) {
      const query = new URLSearchParams();
      if (options?.period) query.set("period", options.period);
      if (options?.granularity) query.set("granularity", options.granularity);
      const qs = query.toString();
      return request(
        qs ? `/intelligence/timeline?${qs}` : "/intelligence/timeline",
        timelineResponseSchema,
      );
    },
    // Sprint 4: Taxonomy & Geography
    getTaxonomySankey(period) {
      const query = new URLSearchParams();
      if (period) query.set("period", period);
      const qs = query.toString();
      return request(
        qs ? `/impact/taxonomy/sankey?${qs}` : "/impact/taxonomy/sankey",
        sankeyResponseSchema,
      );
    },
    getTaxonomyHeatmap(period, granularity) {
      const query = new URLSearchParams();
      if (period) query.set("period", period);
      if (granularity) query.set("granularity", granularity);
      const qs = query.toString();
      return request(
        qs ? `/impact/taxonomy/heatmap?${qs}` : "/impact/taxonomy/heatmap",
        z.array(heatmapCellSchema),
      );
    },
    getTaxonomyTrend(period, categories) {
      const query = new URLSearchParams();
      if (period) query.set("period", period);
      if (categories) query.set("categories", categories);
      const qs = query.toString();
      return request(
        qs ? `/impact/taxonomy/trend?${qs}` : "/impact/taxonomy/trend",
        z.array(taxonomyTrendPointSchema),
      );
    },
    getGeographySummary(period) {
      const query = new URLSearchParams();
      if (period) query.set("period", period);
      const qs = query.toString();
      return request(
        qs ? `/impact/geography?${qs}` : "/impact/geography",
        z.array(geographySummarySchema),
      );
    },
    getGeographyDetail(country, period) {
      const query = new URLSearchParams();
      if (period) query.set("period", period);
      const qs = query.toString();
      return request(
        qs
          ? `/impact/geography/${encodeURIComponent(country)}?${qs}`
          : `/impact/geography/${encodeURIComponent(country)}`,
        countryDetailResponseSchema,
      );
    },
    // Sprint 4: Annotations
    createAnnotation(targetType, targetId, content) {
      return request("/intelligence/annotations", annotationSchema, {
        method: "POST",
        body: JSON.stringify({ targetType, targetId, content }),
      });
    },
    listAnnotations(targetType, targetId) {
      const query = new URLSearchParams();
      if (targetType) query.set("target_type", targetType);
      if (targetId) query.set("target_id", targetId);
      const qs = query.toString();
      return request(
        qs ? `/intelligence/annotations?${qs}` : "/intelligence/annotations",
        z.array(annotationSchema),
      );
    },
    updateAnnotation(annotationId, content) {
      return request(
        `/intelligence/annotations/${annotationId}`,
        annotationSchema,
        {
          method: "PUT",
          body: JSON.stringify({ content }),
        },
      );
    },
    deleteAnnotation(annotationId) {
      return request(
        `/intelligence/annotations/${annotationId}`,
        z.object({ deleted: z.boolean() }),
        { method: "DELETE" },
      );
    },
    // Sprint 4: Entity status & bulk actions
    updateEntityStatus(entityType, canonicalValue, status) {
      return request(
        "/intelligence/entities/status",
        z.object({
          entityType: z.string(),
          canonicalValue: z.string(),
          status: z.string(),
        }),
        {
          method: "POST",
          body: JSON.stringify({ entityType, canonicalValue, status }),
        },
      );
    },
    bulkEntityAction(entityIds, action, options) {
      return request("/intelligence/entities/bulk", bulkActionResultSchema, {
        method: "POST",
        body: JSON.stringify({
          entityIds,
          action,
          ...(options?.tag ? { tag: options.tag } : {}),
          ...(options?.status ? { status: options.status } : {}),
        }),
      });
    },
    // Sprint 5: Watchlist
    addToWatchlist(item) {
      return request("/intelligence/watchlist", watchlistItemSchema, {
        method: "POST",
        body: JSON.stringify(item),
      });
    },
    listWatchlistItems(options) {
      const query = new URLSearchParams();
      if (options?.entityType) query.set("entity_type", options.entityType);
      if (options?.limit) query.set("limit", String(options.limit));
      if (options?.offset) query.set("offset", String(options.offset));
      const qs = query.toString();
      return request(
        qs ? `/intelligence/watchlist?${qs}` : "/intelligence/watchlist",
        watchlistListResponseSchema,
      );
    },
    updateWatchlistItem(watchlistId, update) {
      return request(
        `/intelligence/watchlist/${watchlistId}`,
        watchlistItemSchema,
        { method: "PUT", body: JSON.stringify(update) },
      );
    },
    removeFromWatchlist(watchlistId) {
      return request(
        `/intelligence/watchlist/${watchlistId}`,
        z.object({ deleted: z.boolean() }),
        { method: "DELETE" },
      );
    },
    getWatchlistAlerts(options) {
      const query = new URLSearchParams();
      if (options?.unreadOnly) query.set("unread_only", "true");
      if (options?.limit) query.set("limit", String(options.limit));
      const qs = query.toString();
      return request(
        qs
          ? `/intelligence/watchlist/alerts?${qs}`
          : "/intelligence/watchlist/alerts",
        z.array(watchlistAlertSchema),
      );
    },
    markAlertRead(alertId) {
      return request(
        `/intelligence/watchlist/alerts/${alertId}/read`,
        z.object({ markedRead: z.boolean() }),
        { method: "POST" },
      );
    },
    markAllAlertsRead() {
      return request(
        "/intelligence/watchlist/alerts/read-all",
        z.object({ markedRead: z.number() }),
        { method: "POST" },
      );
    },
    // Sprint 5: Scheduled Reports
    createReportSchedule(schedule) {
      return request("/reports/schedules", reportScheduleSchema, {
        method: "POST",
        body: JSON.stringify(schedule),
      });
    },
    listReportSchedules() {
      return request("/reports/schedules", z.array(reportScheduleSchema));
    },
    updateReportSchedule(scheduleId, update) {
      return request(`/reports/schedules/${scheduleId}`, reportScheduleSchema, {
        method: "PUT",
        body: JSON.stringify(update),
      });
    },
    deleteReportSchedule(scheduleId) {
      return request(
        `/reports/schedules/${scheduleId}`,
        z.object({ deleted: z.boolean() }),
        { method: "DELETE" },
      );
    },
    // SSI Case Integration (Phase 3)
    getCaseActivity(caseId) {
      return request(`/cases/${caseId}/activity`, caseActivityResponseSchema);
    },
    investigateCaseUrl(caseId, body) {
      return request(`/cases/${caseId}/investigate`, z.record(z.unknown()), {
        method: "POST",
        body: JSON.stringify(body),
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
  annotationSchema,
  bulkActionResultSchema,
  campaignTimelinePointSchema,
  casesResponseSchema,
  clusterSummarySchema,
  countryDetailResponseSchema,
  cumulativeIndicatorPointSchema,
  dashboardOverviewSchema,
  detectionVelocityPointSchema,
  dossierListRequestSchema,
  geographySummarySchema,
  graphPayloadSchema,
  heatmapCellSchema,
  impactDashboardSchema,
  leaSuggestionResponseSchema,
  pipelineFunnelStageSchema,
  reportLibraryResponseSchema,
  reportScheduleSchema,
  sankeyResponseSchema,
  searchRequestSchema,
  searchResponseSchema,
  taxonomyLossItemSchema,
  taxonomyResponseSchema,
  taxonomyTrendPointSchema,
  threatCampaignDetailSchema,
  threatCampaignListSchema,
  timelineResponseSchema,
  watchlistAlertSchema,
  watchlistItemSchema,
  watchlistListResponseSchema,
};

/**
 * Domain Types
 *
 * Re-exported from @i4g/sdk (canonical source) for convenience.
 * The SDK Zod schemas remain the single source of truth.
 */
export type {
  /* Dashboard */
  DashboardOverview,
  DashboardMetric,
  DashboardAlert,
  DashboardActivity,
  DashboardReminder,

  /* Search */
  SearchRequestInput,
  SearchResponse,
  SearchResult,
  SearchFacet,

  /* Cases */
  CaseSummary,
  CasesResponse,
  CaseDetail,
  CaseArtifact,
  CaseTimelineEvent,

  /* Classification */
  FraudClassificationResult,
  ScoredLabel,

  /* Dossiers */
  DossierRecord,
  DossierListResponse,
  DossierVerificationReport,

  /* Analytics */
  AnalyticsOverview,
  AnalyticsMetric,

  /* Intake */
  IntakeRecord,

  /* Client */
  I4GClient,
  ClientConfig,
  DetokenizeResponse,
} from "@i4g/sdk";

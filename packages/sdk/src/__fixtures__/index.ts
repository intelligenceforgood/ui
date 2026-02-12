/**
 * Mock data & client — for unit tests only.
 *
 * Production code must NOT import from this module; use `createClient()`
 * from the SDK root instead.
 */

import { z } from "zod";
import type {
  AnalyticsOverview,
  CasesResponse,
  DashboardOverview,
  DossierListResponse,
  DossierListOptions,
  DossierRecord,
  DossierVerificationReport,
  I4GClient,
  SearchResponse,
  SearchRequestInput,
  SearchResult,
  SearchFacet,
  TaxonomyResponse,
  DetokenizeResponse,
} from "../index";
import { searchRequestSchema, dossierListRequestSchema } from "../index";

function toMillis(section: string) {
  return section.length * 9 + 42;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const mockDashboardData: DashboardOverview = {
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

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export const mockSearchResults: SearchResult[] = [
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

export const mockFacets: SearchFacet[] = [
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

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const mockCasesResponse: CasesResponse = {
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
      status: "in_review",
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
      status: "awaiting_input",
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
      status: "in_review",
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
      status: "awaiting_input",
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
      status: "in_review",
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

// ---------------------------------------------------------------------------
// Taxonomy
// ---------------------------------------------------------------------------

export const mockTaxonomyResponse: TaxonomyResponse = {
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

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export const mockAnalyticsResponse: AnalyticsOverview = {
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

// ---------------------------------------------------------------------------
// Dossiers
// ---------------------------------------------------------------------------

export const mockDossiers: DossierRecord[] = [
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

export const mockVerificationReports: Record<
  string,
  DossierVerificationReport
> = {
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

// ---------------------------------------------------------------------------
// Mock Client
// ---------------------------------------------------------------------------

/**
 * Creates a mock I4GClient populated with static fixture data.
 *
 * **Test-only** — do not use in production code. Production consumers should
 * use `createClient()` or `createPlatformClient()` which require a live
 * backend URL.
 */
export function createMockClient(): I4GClient {
  return {
    async getDashboardOverview() {
      return mockDashboardData;
    },
    async searchIntelligence(request: SearchRequestInput) {
      const payload = searchRequestSchema.parse(request);
      const normalizedQuery = payload.query.trim().toLowerCase();
      const normalizedSources = new Set(
        payload.sources?.map((s: string) => s.toLowerCase()) ?? [],
      );
      const normalizedTaxonomy = new Set(
        payload.taxonomy?.map((t: string) => t.toLowerCase()) ?? [],
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
    async getCase(id: string) {
      const found = mockCasesResponse.cases.find((c) => c.id === id);
      const base = found || {
        id,
        title: `Investigation ${id}`,
        status: "in_review" as const,
        priority: "medium" as const,
        assignee: "analyst@example.com",
        updatedAt: new Date().toISOString(),
        queue: "General",
        tags: [],
        progress: 0,
        dueAt: null,
      };

      return {
        ...base,
        description: "Mocked detailed view for UI development.",
        artifacts: [
          {
            id: "art-1",
            type: "document",
            name: "Suspicious Report.pdf",
            metadata: { size: "1.2MB" },
          },
        ],
        timeline: [
          {
            id: "evt-1",
            timestamp: new Date().toISOString(),
            description: "Case opened",
            type: "system",
          },
        ],
        graphNodes: [],
        graphLinks: [],
      };
    },
    async getTaxonomy() {
      return mockTaxonomyResponse;
    },
    async getAnalyticsOverview() {
      return mockAnalyticsResponse;
    },
    async listDossiers(options?: DossierListOptions) {
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
    async verifyDossier(planId: string) {
      const planIdSchema = z.string().min(1, "planId is required");
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
    async detokenize(
      token: string,
      caseId?: string,
    ): Promise<DetokenizeResponse> {
      return {
        token,
        prefix: token.split("-")[0] || "UNK",
        canonicalValue: `[REVEALED: ${token}]`,
        pepperVersion: "mock-v1",
        caseId: caseId || null,
        detector: "mock-detector",
        createdAt: new Date().toISOString(),
      };
    },
  };
}

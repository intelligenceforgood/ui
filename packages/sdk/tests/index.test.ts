import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  intakeSchema,
  parseIntakes,
  taxonomyItemSchema,
  taxonomyAxisSchema,
  taxonomyResponseSchema,
  caseDetailSchema,
  searchRequestSchema,
  searchResponseSchema,
  casesResponseSchema,
  dashboardOverviewSchema,
  analyticsOverviewSchema,
  createMockClient,
} from "../src/index";

// ── Schema validation ──────────────────────────────────────────────

describe("intakeSchema", () => {
  it("parses a valid intake record", () => {
    const data = {
      intake_id: "INT-001",
      summary: "Test intake",
      taxonomy: "INTENT.ROMANCE",
      submitted_at: "2025-01-01T00:00:00Z",
      priority: "high",
    };
    expect(intakeSchema.parse(data)).toMatchObject(data);
  });

  it("rejects invalid priority", () => {
    const data = {
      intake_id: "INT-001",
      summary: "Test",
      taxonomy: "X",
      submitted_at: "2025-01-01T00:00:00Z",
      priority: "critical",
    };
    expect(() => intakeSchema.parse(data)).toThrow();
  });
});

describe("parseIntakes", () => {
  it("parses an array of intake records", () => {
    const data = [
      {
        intake_id: "INT-001",
        summary: "Test",
        taxonomy: "X",
        submitted_at: "2025-01-01",
        priority: "low",
      },
    ];
    const result = parseIntakes(data);
    expect(result).toHaveLength(1);
    expect(result[0].intake_id).toBe("INT-001");
  });

  it("throws on invalid data", () => {
    expect(() => parseIntakes([{ bad: true }])).toThrow();
  });
});

describe("taxonomyItemSchema", () => {
  it("parses a valid taxonomy item", () => {
    const item = {
      code: "INTENT.ROMANCE",
      label: "Romance",
      description: "Emotional relationship for fraud",
      examples: ["dating app scam", "catfishing"],
    };
    expect(taxonomyItemSchema.parse(item)).toMatchObject(item);
  });

  it("requires examples array", () => {
    const item = {
      code: "INTENT.ROMANCE",
      label: "Romance",
      description: "Test",
    };
    expect(() => taxonomyItemSchema.parse(item)).toThrow();
  });
});

describe("taxonomyAxisSchema", () => {
  it("parses an axis with items", () => {
    const axis = {
      id: "intents",
      label: "Scam Intent",
      description: "Primary fraud intent",
      items: [
        {
          code: "INTENT.ROMANCE",
          label: "Romance",
          description: "Test",
          examples: [],
        },
      ],
    };
    expect(taxonomyAxisSchema.parse(axis)).toMatchObject(axis);
  });
});

describe("taxonomyResponseSchema", () => {
  it("parses a full taxonomy response", () => {
    const response = {
      version: "1.0",
      steward: "Policy Team",
      updatedAt: "2025-01-01T00:00:00Z",
      axes: [],
    };
    expect(taxonomyResponseSchema.parse(response)).toMatchObject(response);
  });
});

describe("searchRequestSchema", () => {
  it("parses a minimal search request", () => {
    const req = { query: "test" };
    const result = searchRequestSchema.parse(req);
    expect(result.query).toBe("test");
  });

  it("rejects fromDate after toDate", () => {
    const req = {
      query: "test",
      fromDate: "2025-12-01",
      toDate: "2025-01-01",
    };
    expect(() => searchRequestSchema.parse(req)).toThrow();
  });

  it("accepts valid date range", () => {
    const req = {
      query: "test",
      fromDate: "2025-01-01",
      toDate: "2025-12-01",
    };
    expect(searchRequestSchema.parse(req)).toMatchObject({
      query: "test",
      fromDate: "2025-01-01",
    });
  });
});

describe("caseDetailSchema", () => {
  it("parses a case detail with camelCase graph fields", () => {
    const detail = {
      id: "CASE-001",
      title: "Test case",
      status: "new",
      priority: "high",
      riskScore: 75,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
      source: "api",
      tags: ["fraud"],
      classification: {
        intent: [{ label: "INTENT.ROMANCE", confidence: 0.9 }],
        channel: [],
        techniques: [],
        actions: [],
        persona: [],
        risk_score: 75,
        taxonomy_version: "1.0",
      },
      description: "A test case",
      artifacts: [],
      timeline: [],
      graphNodes: [],
      graphLinks: [],
    };
    const result = caseDetailSchema.parse(detail);
    expect(result.graphNodes).toEqual([]);
    expect(result.graphLinks).toEqual([]);
  });
});

// ── Mock client ────────────────────────────────────────────────────

describe("createMockClient", () => {
  const client = createMockClient();

  it("returns a dashboard overview", async () => {
    const result = await client.getDashboardOverview();
    expect(result.metrics).toBeDefined();
    expect(result.metrics.length).toBeGreaterThan(0);
    expect(result.alerts).toBeDefined();
  });

  it("returns taxonomy with axes", async () => {
    const result = await client.getTaxonomy();
    expect(result.version).toBe("1.0");
    expect(result.axes).toBeDefined();
    expect(result.axes.length).toBeGreaterThan(0);
  });

  it("returns analytics overview", async () => {
    const result = await client.getAnalyticsOverview();
    expect(result.metrics).toBeDefined();
    expect(result.detectionRateSeries).toBeDefined();
  });

  it("lists cases", async () => {
    const result = await client.listCases();
    expect(result.summary).toBeDefined();
    expect(result.cases.length).toBeGreaterThan(0);
  });

  it("gets a case by id", async () => {
    const cases = await client.listCases();
    const id = cases.cases[0].id;
    const detail = await client.getCase(id);
    expect(detail.id).toBe(id);
    expect(detail.artifacts).toBeDefined();
    expect(detail.timeline).toBeDefined();
  });

  it("searches with text filter", async () => {
    const result = await client.searchIntelligence({
      query: "romance",
    });
    expect(result.stats).toBeDefined();
    expect(result.results).toBeDefined();
  });

  it("lists dossiers", async () => {
    const result = await client.listDossiers();
    expect(result.count).toBeGreaterThan(0);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].planId).toBeDefined();
  });

  it("filters dossiers by status", async () => {
    const result = await client.listDossiers({ status: "completed" });
    for (const item of result.items) {
      expect(item.status).toBe("completed");
    }
  });

  it("verifies a dossier", async () => {
    const dossiers = await client.listDossiers();
    const planId = dossiers.items[0].planId;
    const result = await client.verifyDossier(planId);
    expect(result.planId).toBeDefined();
  });

  it("detokenizes a token", async () => {
    const result = await client.detokenize("TOK-abc-123");
    expect(result.token).toBe("TOK-abc-123");
  });
});

/**
 * Tests for platform-client.ts — normalisation helpers and createPlatformClient.
 *
 * The helper functions (normaliseIsoDate, toNumber, buildScore, extractTags, etc.)
 * are module-private. We test them indirectly by feeding synthetic
 * CoreSearchEntry shapes through the public `searchIntelligence` method and
 * asserting on the mapped output.
 *
 * @see src/lib/platform-client.ts
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/iap-token", () => ({
  getIapToken: vi.fn().mockResolvedValue(null),
}));

vi.mock("@i4g/sdk", () => {
  const searchRequestSchema = {
    parse: (input: Record<string, unknown>) => input,
  };

  class I4GClientError extends Error {
    status: number;
    body: unknown;
    constructor(message: string, status: number, body: unknown) {
      super(message);
      this.status = status;
      this.body = body;
    }
  }

  return {
    searchRequestSchema,
    I4GClientError,
    createClient: vi.fn().mockReturnValue({}),
  };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fetchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function coreSearchResponse(results: unknown[], total?: number) {
  return new Response(
    JSON.stringify({
      results,
      total: total ?? results.length,
      elapsed_ms: 42,
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

async function searchWith(results: unknown[]) {
  fetchSpy.mockResolvedValueOnce(coreSearchResponse(results));

  const { createPlatformClient } = await import("@/lib/platform-client");
  const client = createPlatformClient({
    baseUrl: "https://api.test",
    apiKey: "test-key",
  });

  return client.searchIntelligence({ query: "test" });
}

// ---------------------------------------------------------------------------
// Score normalisation (buildScore)
// ---------------------------------------------------------------------------

describe("buildScore normalisation", () => {
  it("passes through a 0-1 score as-is", async () => {
    const res = await searchWith([{ score: 0.85 }]);
    expect(res.results[0].score).toBe(0.85);
  });

  it("scales scores > 1 by dividing by 100", async () => {
    const res = await searchWith([{ score: 73 }]);
    expect(res.results[0].score).toBe(0.73);
  });

  it("converts negative distance to 0-1 via 1/(1+|d|)", async () => {
    const res = await searchWith([{ vector: { distance: -3 } }]);
    expect(res.results[0].score).toBe(Number((1 / 4).toFixed(2)));
  });

  it("uses vector.similarity when score is absent", async () => {
    const res = await searchWith([{ vector: { similarity: 0.6 } }]);
    expect(res.results[0].score).toBe(0.6);
  });

  it("falls back to 0 when nothing numeric is available", async () => {
    const res = await searchWith([{}]);
    expect(res.results[0].score).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tag extraction (extractTags)
// ---------------------------------------------------------------------------

describe("extractTags", () => {
  it("collects classification, metadata.tags, entity values, and vector label", async () => {
    const res = await searchWith([
      {
        record: {
          classification: "romance_scam",
          metadata: { tags: ["crypto", "investment"] },
          entities: { wallets: ["0xABC"] },
        },
        vector: { label: "vector-label" },
      },
    ]);
    const tags = res.results[0].tags;
    expect(tags).toContain("romance_scam");
    expect(tags).toContain("crypto");
    expect(tags).toContain("investment");
    expect(tags).toContain("0xABC");
    expect(tags).toContain("vector-label");
  });

  it("caps at 8 tags", async () => {
    const manyTags = Array.from({ length: 20 }, (_, i) => `tag-${i}`);
    const res = await searchWith([
      { record: { metadata: { tags: manyTags } } },
    ]);
    expect(res.results[0].tags.length).toBeLessThanOrEqual(8);
  });
});

// ---------------------------------------------------------------------------
// Source extraction (extractSource)
// ---------------------------------------------------------------------------

describe("extractSource", () => {
  it('returns "hybrid" when both structured and vector in sources array', async () => {
    const res = await searchWith([{ sources: ["structured", "vector"] }]);
    expect(res.results[0].source).toBe("hybrid");
  });

  it("returns single source name from array", async () => {
    const res = await searchWith([{ sources: ["vector"] }]);
    expect(res.results[0].source).toBe("vector");
  });

  it("returns source string directly", async () => {
    const res = await searchWith([{ sources: "vector" }]);
    expect(res.results[0].source).toBe("vector");
  });

  it('infers "vector" when vector record is present', async () => {
    const res = await searchWith([{ vector: { text: "hi" } }]);
    expect(res.results[0].source).toBe("vector");
  });

  it('infers "structured" when record is present', async () => {
    const res = await searchWith([{ record: { text: "hello" } }]);
    expect(res.results[0].source).toBe("structured");
  });

  it('returns "unknown" for empty entry', async () => {
    const res = await searchWith([{}]);
    expect(res.results[0].source).toBe("unknown");
  });
});

// ---------------------------------------------------------------------------
// Title and snippet extraction
// ---------------------------------------------------------------------------

describe("extractTitle", () => {
  it("prefers record.metadata.title", async () => {
    const res = await searchWith([
      {
        record: {
          metadata: { title: "Fraud Alert" },
          text: "some body text",
        },
      },
    ]);
    expect(res.results[0].title).toBe("Fraud Alert");
  });

  it("falls back to record.case_id", async () => {
    const res = await searchWith([{ record: { case_id: "CASE-001" } }]);
    expect(res.results[0].title).toBe("CASE-001");
  });

  it('falls back to "Result" when nothing available', async () => {
    const res = await searchWith([{}]);
    expect(res.results[0].title).toBe("Result");
  });
});

describe("extractSnippet", () => {
  it("truncates text at 280 chars", async () => {
    const longText = "a".repeat(500);
    const res = await searchWith([{ record: { text: longText } }]);
    expect(res.results[0].snippet.length).toBe(280);
  });

  it("uses vector document as fallback text", async () => {
    const res = await searchWith([{ vector: { document: "doc content" } }]);
    expect(res.results[0].snippet).toBe("doc content");
  });

  it("shows classification fallback for migrated data", async () => {
    const res = await searchWith([{ metadata: { classification: "ponzi" } }]);
    expect(res.results[0].snippet).toContain("ponzi");
  });
});

// ---------------------------------------------------------------------------
// Facets and suggestions
// ---------------------------------------------------------------------------

describe("buildFacets", () => {
  it("produces source and taxonomy facets", async () => {
    const res = await searchWith([
      {
        sources: "vector",
        record: { classification: "phishing", metadata: { tags: ["url"] } },
      },
      {
        sources: "structured",
        record: { classification: "phishing" },
      },
    ]);
    expect(res.facets.length).toBeGreaterThanOrEqual(1);
    const sourceFacet = res.facets.find(
      (f: { field: string }) => f.field === "source",
    );
    expect(sourceFacet).toBeDefined();
  });
});

describe("buildSuggestions", () => {
  it("derives suggestions from top tags", async () => {
    const res = await searchWith([
      { record: { classification: "romance_scam" } },
      { record: { classification: "pig_butchering" } },
    ]);
    expect(res.suggestions.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// ID mapping (mapCoreSearchResult)
// ---------------------------------------------------------------------------

describe("mapCoreSearchResult ID mapping", () => {
  it("uses record.case_id as ID", async () => {
    const res = await searchWith([{ record: { case_id: "C-123" } }]);
    expect(res.results[0].id).toBe("C-123");
  });

  it("uses entry.case_id as fallback", async () => {
    const res = await searchWith([{ case_id: "E-456" }]);
    expect(res.results[0].id).toBe("E-456");
  });

  it("generates fallback ID from index", async () => {
    const res = await searchWith([{}]);
    expect(res.results[0].id).toBe("core-result-0");
  });
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

describe("response stats", () => {
  it("populates stats from response payload", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ results: [], total: 42, elapsed_ms: 100 }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const { createPlatformClient } = await import("@/lib/platform-client");
    const client = createPlatformClient({ baseUrl: "https://api.test" });
    const res = await client.searchIntelligence({ query: "test" });

    expect(res.stats.total).toBe(42);
    expect(res.stats.took).toBe(100);
  });
});

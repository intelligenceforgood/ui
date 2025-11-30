import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SearchExperience from "@/app/(console)/search/search-experience";
import type { HybridSearchSchema } from "@/types/reviews";
import { createMockClient, type SearchResponse } from "@i4g/sdk";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

vi.mock("next/navigation", () => {
  const mockRouter = {
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  };

  return {
    useRouter: () => mockRouter,
  };
});

let initialResults: SearchResponse;
const originalFetch = global.fetch;
let fetchMock: Mock;

const mockSchema: HybridSearchSchema = {
  indicatorTypes: ["bank_account", "crypto_wallet"],
  datasets: ["retrieval_poc_dev"],
  classifications: ["romance_scam"],
  lossBuckets: ["<10k", "10k-50k"],
  timePresets: ["7d", "30d"],
};

describe("SearchExperience", () => {
  beforeAll(async () => {
    const client = createMockClient();
    initialResults = await client.searchIntelligence({ query: "", page: 1, pageSize: 10 });
  });

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => initialResults,
    });

    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it("renders initial search results", () => {
    render(<SearchExperience initialResults={initialResults} schema={mockSchema} />);

    const heading = screen.getByText(/shipping manifest links group-7/i);
    expect(heading).toBeInTheDocument();
  });

  it("submits a new query", async () => {
    render(<SearchExperience initialResults={initialResults} schema={mockSchema} />);

    const input = screen.getByPlaceholderText(/search by entity/i);
    fireEvent.change(input, { target: { value: "group-7" } });

    const submit = screen.getByRole("button", { name: /^search$/i });
    fireEvent.click(submit);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const requestBody = JSON.parse(requestInit.body as string);
    expect(requestBody.query).toBe("group-7");
  });

  it("toggles source facet filters", async () => {
    render(<SearchExperience initialResults={initialResults} schema={mockSchema} />);

    const sourceFacetButton = screen.getByRole("button", { name: /customs/i });
    fireEvent.click(sourceFacetButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const requestBody = JSON.parse(requestInit.body as string);
    expect(requestBody.sources).toContain("customs");
  });
});

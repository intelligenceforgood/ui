import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";

// Mock lucide-react icons as simple spans
vi.mock("lucide-react", () => ({
  AlertTriangle: ({ className }: { className?: string }) => (
    <span data-testid="icon-alert" className={className} />
  ),
  RefreshCw: ({ className }: { className?: string }) => (
    <span data-testid="icon-refresh" className={className} />
  ),
  Search: ({ className }: { className?: string }) => (
    <span data-testid="icon-search" className={className} />
  ),
  ShieldAlert: ({ className }: { className?: string }) => (
    <span data-testid="icon-shield" className={className} />
  ),
  Zap: ({ className }: { className?: string }) => (
    <span data-testid="icon-zap" className={className} />
  ),
}));

// Mock @i4g/ui-kit
vi.mock("@i4g/ui-kit", () => ({
  Badge: ({ children, variant }: { children: ReactNode; variant?: string }) => (
    <span data-variant={variant}>{children}</span>
  ),
  Card: ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
}));

import EcxFeedPage from "@/app/(console)/ssi/ecx-feed/page";
import type { EcxFeedResponse, EcxPollingStatusResponse } from "@/types/ssi";

const feedResponse: EcxFeedResponse = {
  module: "phish",
  count: 2,
  records: [
    {
      id: 101,
      url: "https://phishing-example.com/login",
      brand: "BankCo",
      confidence: 90,
      discovered_at: 1717200000,
      tld: "com",
    },
    {
      id: 102,
      domain: "suspicious-domain.xyz",
      brand: "FinApp",
      confidence: 45,
      discovered_at: 1717300000,
      tld: "xyz",
    },
  ],
};

const pollingStatusResponse: EcxPollingStatusResponse = {
  modules: [
    {
      module: "phish",
      last_polled_id: 100,
      last_polled_at: "2025-06-01T12:00:00Z",
      records_found: 250,
      errors: 0,
    },
  ],
};

function mockFetchResponses(options?: {
  feedError?: boolean;
  pollingError?: boolean;
}) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.includes("/api/ssi/ecx/feed")) {
      if (options?.feedError) {
        return Promise.resolve({
          ok: false,
          status: 503,
          json: () => Promise.resolve({ detail: "eCX is not available" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(feedResponse),
      });
    }
    if (url.includes("/api/ssi/ecx/polling-status")) {
      if (options?.pollingError) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({}),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(pollingStatusResponse),
      });
    }
    if (url.includes("/api/ssi/investigate")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ investigation_id: "inv-001" }),
      });
    }
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    });
  }) as Mock;

  global.fetch = fetchMock;
  return fetchMock;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("EcxFeedPage", () => {
  it("renders the page title and filter controls", async () => {
    mockFetchResponses();
    render(<EcxFeedPage />);

    expect(screen.getByText("eCX Intelligence Feed")).toBeInTheDocument();
    expect(screen.getByLabelText("Module")).toBeInTheDocument();
    expect(screen.getByLabelText("Min Confidence")).toBeInTheDocument();
    expect(screen.getByLabelText("Brand")).toBeInTheDocument();
  });

  it("fetches and displays feed records on mount", async () => {
    mockFetchResponses();
    render(<EcxFeedPage />);

    await waitFor(() => {
      expect(
        screen.getByText("https://phishing-example.com/login"),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("suspicious-domain.xyz")).toBeInTheDocument();
    expect(screen.getByText("BankCo")).toBeInTheDocument();
    expect(screen.getByText("FinApp")).toBeInTheDocument();
    expect(screen.getByText("90% confidence")).toBeInTheDocument();
    expect(screen.getByText("45% confidence")).toBeInTheDocument();
  });

  it("displays polling status banner", async () => {
    mockFetchResponses();
    render(<EcxFeedPage />);

    await waitFor(() => {
      expect(screen.getByText(/Records found: 250/)).toBeInTheDocument();
    });
  });

  it("shows an error when the feed request fails", async () => {
    mockFetchResponses({ feedError: true });
    render(<EcxFeedPage />);

    await waitFor(() => {
      expect(screen.getByText("eCX is not available")).toBeInTheDocument();
    });
  });

  it("shows empty state when no records are returned", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/ssi/ecx/feed")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ module: "phish", count: 0, records: [] }),
        });
      }
      if (url.includes("/api/ssi/ecx/polling-status")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ modules: [] }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({}),
      });
    }) as Mock;
    global.fetch = fetchMock;

    render(<EcxFeedPage />);

    await waitFor(() => {
      expect(
        screen.getByText("No records found. Try adjusting your filters."),
      ).toBeInTheDocument();
    });
  });

  it("passes filters to the feed request", async () => {
    const fetchMock = mockFetchResponses();
    render(<EcxFeedPage />);

    // Wait for initial fetch
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    // Verify the initial request included module=phish
    const firstCall = fetchMock.mock.calls.find(
      (c: unknown[]) =>
        typeof c[0] === "string" &&
        (c[0] as string).includes("/api/ssi/ecx/feed"),
    );
    expect(firstCall).toBeDefined();
    expect(firstCall![0]).toContain("module=phish");
    expect(firstCall![0]).toContain("limit=50");
  });

  it("renders investigate button for phish records with a url", async () => {
    mockFetchResponses();
    render(<EcxFeedPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Investigate")).toHaveLength(2);
    });
  });

  it("triggers investigation on button click", async () => {
    const fetchMock = mockFetchResponses();
    const openSpy = vi.fn();
    window.open = openSpy;

    render(<EcxFeedPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Investigate")).toHaveLength(2);
    });

    const investigateButtons = screen.getAllByText("Investigate");
    fireEvent.click(investigateButtons[0]);

    await waitFor(() => {
      const investigateCall = fetchMock.mock.calls.find(
        (c: unknown[]) =>
          typeof c[0] === "string" &&
          (c[0] as string).includes("/api/ssi/investigate"),
      );
      expect(investigateCall).toBeDefined();
    });
  });

  it("shows eCX record IDs", async () => {
    mockFetchResponses();
    render(<EcxFeedPage />);

    await waitFor(() => {
      expect(screen.getByText("eCX #101")).toBeInTheDocument();
      expect(screen.getByText("eCX #102")).toBeInTheDocument();
    });
  });
});

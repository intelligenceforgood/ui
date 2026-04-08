import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";

// Mock lucide-react
vi.mock("lucide-react", () => ({
  RefreshCw: ({ className }: { className?: string }) => (
    <span data-testid="icon-refresh" className={className} />
  ),
}));

// Mock @i4g/ui-kit
vi.mock("@i4g/ui-kit", () => ({
  Card: ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  FeedbackButton: () => null,
}));

// Mock recharts — render simplified chart components
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  BarChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  PieChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Pie: ({ children }: { children?: ReactNode }) => (
    <div data-testid="pie">{children}</div>
  ),
  Cell: () => <div data-testid="cell" />,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

import TrendDashboardPage from "@/app/(console)/ssi/ecx-dashboard/page";

const brandResponse = {
  series: [
    { brand: "BankCo", date: "2025-06-01", count: 5 },
    { brand: "BankCo", date: "2025-06-02", count: 3 },
    { brand: "FinApp", date: "2025-06-01", count: 2 },
  ],
};

const walletResponse = {
  top_wallets: [
    {
      token_symbol: "ETH",
      network_short: "ethereum",
      wallet_address: "0xabc123def456",
      count: 15,
    },
  ],
  currency_breakdown: [
    { token_symbol: "ETH", count: 20 },
    { token_symbol: "BTC", count: 10 },
  ],
};

const geoResponse = {
  distribution: [
    { country: "US", count: 50 },
    { country: "RU", count: 30 },
  ],
};

function mockFetchResponses(options?: { empty?: boolean }) {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.includes("/stats/phish-by-brand")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(options?.empty ? { series: [] } : brandResponse),
      });
    }
    if (url.includes("/stats/wallet-heatmap")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            options?.empty
              ? { top_wallets: [], currency_breakdown: [] }
              : walletResponse,
          ),
      });
    }
    if (url.includes("/stats/geo-infrastructure")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(options?.empty ? { distribution: [] } : geoResponse),
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

describe("TrendDashboardPage", () => {
  it("renders the dashboard title", async () => {
    mockFetchResponses();
    render(<TrendDashboardPage />);

    expect(screen.getByText("eCX Trend Dashboard")).toBeInTheDocument();
  });

  it("renders section headings", async () => {
    mockFetchResponses();
    render(<TrendDashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Phish Submissions by Brand (30 days)"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Wallet Currencies")).toBeInTheDocument();
    expect(
      screen.getByText("Most-Reported Wallet Addresses"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Infrastructure Geographic Distribution"),
    ).toBeInTheDocument();
  });

  it("fetches all three stats endpoints on mount", async () => {
    const fetchMock = mockFetchResponses();
    render(<TrendDashboardPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    const calls = fetchMock.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(calls.some((u) => u.includes("phish-by-brand"))).toBe(true);
    expect(calls.some((u) => u.includes("wallet-heatmap"))).toBe(true);
    expect(calls.some((u) => u.includes("geo-infrastructure"))).toBe(true);
  });

  it("renders charts when data is available", async () => {
    mockFetchResponses();
    render(<TrendDashboardPage />);

    await waitFor(() => {
      expect(
        screen.getAllByTestId("responsive-container").length,
      ).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders empty states when no data is available", async () => {
    mockFetchResponses({ empty: true });
    render(<TrendDashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText("No submission data available."),
      ).toBeInTheDocument();
    });
    expect(
      screen.getAllByText("No wallet data available.").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText("No geographic data available."),
    ).toBeInTheDocument();
  });

  it("has a refresh button", async () => {
    mockFetchResponses();
    render(<TrendDashboardPage />);

    expect(screen.getByText("Refresh")).toBeInTheDocument();
  });
});

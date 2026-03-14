import { render, screen, waitFor } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("@i4g/ui-kit", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Input: (props: any) => <input {...props} />,
  SectionLabel: ({ children }: any) => <span>{children}</span>,
}));

vi.mock("lucide-react", () => ({
  BarChart3: () => <span data-testid="icon-bar" />,
  TrendingUp: () => <span data-testid="icon-trend" />,
  Globe: ({ className }: any) => (
    <span data-testid="icon-globe" className={className} />
  ),
  Calendar: () => <span data-testid="icon-calendar" />,
  Clock: () => <span data-testid="icon-clock" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  ChevronRight: ({ className }: any) => (
    <span data-testid="icon-chevron-right" className={className} />
  ),
  ArrowRight: () => <span data-testid="icon-arrow" />,
  Filter: () => <span data-testid="icon-filter" />,
  MapPin: () => <span data-testid="icon-map" />,
  X: ({ className }: any) => (
    <span data-testid="icon-x" className={className} />
  ),
}));

// --- Timeline tests ---

import TimelineView from "@/app/(console)/intelligence/timeline/timeline-view";

const mockTimeline = {
  tracks: [
    {
      track: "cases",
      data: [
        { period: "2025-W20", count: 10 },
        { period: "2025-W21", count: 14 },
      ],
    },
    {
      track: "indicators",
      data: [
        { period: "2025-W20", count: 5 },
        { period: "2025-W21", count: 8 },
      ],
    },
  ],
  granularity: "week",
};

let fetchMock: Mock;

describe("TimelineView", () => {
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTimeline,
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders granularity controls", () => {
    render(<TimelineView />);
    expect(screen.getByText("week")).toBeInTheDocument();
    expect(screen.getByText("day")).toBeInTheDocument();
    expect(screen.getByText("month")).toBeInTheDocument();
  });

  it("renders period controls", () => {
    render(<TimelineView />);
    expect(screen.getByText("90d")).toBeInTheDocument();
    expect(screen.getByText("7d")).toBeInTheDocument();
    expect(screen.getByText("year")).toBeInTheDocument();
  });

  it("fetches timeline data on mount", async () => {
    render(<TimelineView />);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/intelligence/timeline"),
      );
    });
  });

  it("displays track names after fetch", async () => {
    render(<TimelineView />);
    await waitFor(() => {
      expect(screen.getByText("cases")).toBeInTheDocument();
      expect(screen.getByText("indicators")).toBeInTheDocument();
    });
  });
});

// --- TaxonomyExplorer tests ---

import TaxonomyExplorer from "@/app/(console)/impact/taxonomy-explorer/taxonomy-explorer";

const mockSankey = {
  nodes: [
    { id: "Crypto Fraud", label: "Crypto Fraud", value: 20 },
    { id: "Crypto Fraud:Pig Butchering", label: "Pig Butchering", value: 15 },
  ],
  links: [
    {
      source: "Crypto Fraud",
      target: "Crypto Fraud:Pig Butchering",
      value: 15,
    },
  ],
};

describe("TaxonomyExplorer", () => {
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSankey,
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders view mode buttons", () => {
    render(<TaxonomyExplorer />);
    expect(screen.getByText("Sankey")).toBeInTheDocument();
    expect(screen.getByText("Heatmap")).toBeInTheDocument();
    expect(screen.getByText("Trend")).toBeInTheDocument();
  });

  it("fetches sankey data on mount", async () => {
    render(<TaxonomyExplorer />);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/impact/taxonomy/sankey"),
      );
    });
  });

  it("displays sankey data after fetch", async () => {
    render(<TaxonomyExplorer />);
    await waitFor(() => {
      expect(screen.getByText("Crypto Fraud")).toBeInTheDocument();
      expect(screen.getByText("Pig Butchering")).toBeInTheDocument();
    });
  });
});

// --- GeographyView tests ---

import GeographyView from "@/app/(console)/impact/geography/geography-view";

const mockGeoSummary = [
  { country: "US", caseCount: 50, totalLoss: 250000, victimCount: 50 },
  { country: "GB", caseCount: 20, totalLoss: 80000, victimCount: 20 },
];

describe("GeographyView", () => {
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGeoSummary,
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders period controls", () => {
    render(<GeographyView />);
    expect(screen.getByText("90d")).toBeInTheDocument();
    expect(screen.getByText("30d")).toBeInTheDocument();
  });

  it("fetches geography data on mount", async () => {
    render(<GeographyView />);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/impact/geography"),
      );
    });
  });

  it("displays summary stats after fetch", async () => {
    render(<GeographyView />);
    await waitFor(() => {
      expect(screen.getByText("Countries")).toBeInTheDocument();
      expect(screen.getByText("Total Cases")).toBeInTheDocument();
      expect(screen.getByText("Total Loss")).toBeInTheDocument();
    });
  });

  it("displays country list after fetch", async () => {
    render(<GeographyView />);
    await waitFor(() => {
      expect(screen.getByText("US")).toBeInTheDocument();
      expect(screen.getByText("GB")).toBeInTheDocument();
    });
  });
});

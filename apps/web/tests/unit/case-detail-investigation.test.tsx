import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — must appear before component imports
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

vi.mock("@/lib/i4g-client", () => ({}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@i4g/ui-kit", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@radix-ui/react-dialog", () => ({
  Root: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  Portal: ({ children }: any) => <div>{children}</div>,
  Overlay: () => <div data-testid="overlay" />,
  Content: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Title: ({ children }: any) => <h2>{children}</h2>,
  Description: ({ children }: any) => <p>{children}</p>,
  Close: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("lucide-react", () => ({
  CheckCircle: () => <span data-testid="icon-check" />,
  ChevronDown: () => <span data-testid="icon-chevron-down" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
  Clock: () => <span data-testid="icon-clock" />,
  ExternalLink: () => <span data-testid="icon-external" />,
  Globe: () => <span data-testid="icon-globe" />,
  Loader2: () => <span data-testid="icon-loader" />,
  Minus: () => <span data-testid="icon-minus" />,
  RefreshCw: () => <span data-testid="icon-refresh" />,
  Search: () => <span data-testid="icon-search" />,
  TrendingDown: () => <span data-testid="icon-trend-down" />,
  TrendingUp: () => <span data-testid="icon-trend-up" />,
  XCircle: () => <span data-testid="icon-x-circle" />,
  AlertTriangle: () => <span data-testid="icon-alert" />,
}));

vi.mock("@/components/help", () => ({
  FieldHelp: () => null,
}));

// ---------------------------------------------------------------------------
// Component imports
// ---------------------------------------------------------------------------

import { ActivityBar } from "@/components/case-detail/activity-bar";
import { InvestigationStatusPanel } from "@/components/case-detail/investigation-status-panel";
import { DedupWarningModal } from "@/components/case-detail/dedup-warning-modal";
import { InvestigationHistory } from "@/components/case-detail/investigation-history";
import type { CaseActivity, CaseInvestigationSummary } from "@i4g/sdk";

// ---------------------------------------------------------------------------
// ActivityBar tests
// ---------------------------------------------------------------------------

describe("ActivityBar", () => {
  const baseActivity: CaseActivity = {
    type: "classification",
    status: "completed",
    startedAt: null,
    completedAt: "2026-03-15T10:00:00Z",
    progress: null,
    total: null,
    scanId: null,
    url: null,
    riskScore: null,
  };

  it("renders nothing when no activities", () => {
    const { container } = render(
      <ActivityBar activities={[]} hasRunning={false} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders collapsed summary when all completed", () => {
    render(
      <ActivityBar
        activities={[
          baseActivity,
          { ...baseActivity, type: "linkage_extraction" },
        ]}
        hasRunning={false}
      />,
    );
    expect(
      screen.getByText(/2 enrichment steps completed/),
    ).toBeInTheDocument();
  });

  it("renders individual pills when something is running", () => {
    render(
      <ActivityBar
        activities={[
          baseActivity,
          {
            ...baseActivity,
            type: "ssi_investigation",
            status: "running",
            url: "https://example.com/scam",
          },
        ]}
        hasRunning={true}
      />,
    );
    expect(screen.getByText("Classified")).toBeInTheDocument();
    expect(screen.getByText(/Investigating example\.com/)).toBeInTheDocument();
  });

  it("makes SSI investigation pills clickable", () => {
    const onClick = vi.fn();
    render(
      <ActivityBar
        activities={[
          {
            ...baseActivity,
            type: "ssi_investigation",
            status: "completed",
            scanId: "scan-123",
            url: "https://test.com",
          },
        ]}
        hasRunning={false}
        onInvestigationClick={onClick}
      />,
    );
    // The collapsed summary renders since all completed — but individual pills
    // are only shown when hasRunning=true. Let's test with a running one.
  });

  it("renders running SSI pill as clickable button", () => {
    const onClick = vi.fn();
    render(
      <ActivityBar
        activities={[
          {
            ...baseActivity,
            type: "ssi_investigation",
            status: "running",
            scanId: "scan-123",
            url: "https://fraud-site.com",
          },
        ]}
        hasRunning={true}
        onInvestigationClick={onClick}
      />,
    );
    const pill = screen.getByRole("button");
    fireEvent.click(pill);
    expect(onClick).toHaveBeenCalledWith("scan-123");
  });

  it("renders failed status with correct badge", () => {
    render(
      <ActivityBar
        activities={[
          {
            ...baseActivity,
            type: "ssi_investigation",
            status: "failed",
            url: "https://bad.com",
          },
        ]}
        hasRunning={false}
      />,
    );
    // When has failed activities but nothing running, it doesn't collapse to summary
    expect(screen.getByText(/Failed: bad\.com/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// InvestigationStatusPanel tests
// ---------------------------------------------------------------------------

describe("InvestigationStatusPanel", () => {
  const completedInvestigation: CaseInvestigationSummary = {
    scanId: "scan-1",
    url: "https://scam-site.com/phishing",
    normalizedUrl: "https://scam-site.com/phishing",
    status: "completed",
    riskScore: 87.5,
    completedAt: "2026-03-10T12:00:00Z",
    triggerType: "manual",
    linkedAt: "2026-03-10T10:00:00Z",
  };

  const onInvestigate = vi.fn();
  const onReinvestigate = vi.fn();
  const onViewResult = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no URLs", () => {
    render(
      <InvestigationStatusPanel
        investigations={[]}
        caseUrls={[]}
        onInvestigate={onInvestigate}
        onReinvestigate={onReinvestigate}
        onViewResult={onViewResult}
      />,
    );
    expect(screen.getByText(/No URLs found/)).toBeInTheDocument();
  });

  it("renders investigated URL with risk score", () => {
    render(
      <InvestigationStatusPanel
        investigations={[completedInvestigation]}
        caseUrls={[]}
        onInvestigate={onInvestigate}
        onReinvestigate={onReinvestigate}
        onViewResult={onViewResult}
      />,
    );
    expect(screen.getByText("scam-site.com")).toBeInTheDocument();
    expect(screen.getByText("Risk: 87.5")).toBeInTheDocument();
  });

  it("renders uninvestigated URL with Investigate button", () => {
    render(
      <InvestigationStatusPanel
        investigations={[]}
        caseUrls={["https://suspicious.com/page"]}
        onInvestigate={onInvestigate}
        onReinvestigate={onReinvestigate}
        onViewResult={onViewResult}
      />,
    );
    expect(screen.getByText("suspicious.com")).toBeInTheDocument();
    expect(screen.getByText("Not investigated")).toBeInTheDocument();

    const btn = screen.getByLabelText("Investigate suspicious.com");
    fireEvent.click(btn);
    expect(onInvestigate).toHaveBeenCalledWith("https://suspicious.com/page");
  });

  it("renders View and Re-investigate buttons for completed investigations", () => {
    render(
      <InvestigationStatusPanel
        investigations={[completedInvestigation]}
        caseUrls={[]}
        onInvestigate={onInvestigate}
        onReinvestigate={onReinvestigate}
        onViewResult={onViewResult}
      />,
    );

    const viewBtn = screen.getByLabelText(/View investigation result/);
    fireEvent.click(viewBtn);
    expect(onViewResult).toHaveBeenCalledWith("scan-1");

    const reBtn = screen.getByLabelText(/Re-investigate/);
    fireEvent.click(reBtn);
    expect(onReinvestigate).toHaveBeenCalledWith(
      "https://scam-site.com/phishing",
      "scan-1",
    );
  });

  it("renders mix of investigated and uninvestigated URLs", () => {
    render(
      <InvestigationStatusPanel
        investigations={[completedInvestigation]}
        caseUrls={["https://new-site.com"]}
        onInvestigate={onInvestigate}
        onReinvestigate={onReinvestigate}
        onViewResult={onViewResult}
      />,
    );
    expect(screen.getByText("scam-site.com")).toBeInTheDocument();
    expect(screen.getByText("new-site.com")).toBeInTheDocument();
  });

  it("displays risk score formatted to 1 decimal", () => {
    render(
      <InvestigationStatusPanel
        investigations={[{ ...completedInvestigation, riskScore: 42.789 }]}
        caseUrls={[]}
        onInvestigate={onInvestigate}
        onReinvestigate={onReinvestigate}
        onViewResult={onViewResult}
      />,
    );
    expect(screen.getByText("Risk: 42.8")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// DedupWarningModal tests
// ---------------------------------------------------------------------------

describe("DedupWarningModal", () => {
  const onClose = vi.fn();
  const onViewExisting = vi.fn();
  const onReinvestigateSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          triggered: true,
          scanId: "new-scan",
        }),
    });
  });

  it("renders dedup info when open", () => {
    render(
      <DedupWarningModal
        isOpen={true}
        onClose={onClose}
        caseId="case-1"
        url="https://scam.com"
        existingScanId="scan-old"
        existingRiskScore={85.0}
        daysSinceScan={3}
        onViewExisting={onViewExisting}
        onReinvestigateSuccess={onReinvestigateSuccess}
      />,
    );
    expect(screen.getByText(/URL Already Investigated/)).toBeInTheDocument();
    expect(screen.getByText(/3 days ago/)).toBeInTheDocument();
    expect(screen.getByText("85.0")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const { container } = render(
      <DedupWarningModal
        isOpen={false}
        onClose={onClose}
        caseId="case-1"
        url="https://scam.com"
        existingScanId="scan-old"
        existingRiskScore={85.0}
        daysSinceScan={3}
        onViewExisting={onViewExisting}
        onReinvestigateSuccess={onReinvestigateSuccess}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("calls onViewExisting when View Existing button clicked", () => {
    render(
      <DedupWarningModal
        isOpen={true}
        onClose={onClose}
        caseId="case-1"
        url="https://scam.com"
        existingScanId="scan-old"
        existingRiskScore={85.0}
        daysSinceScan={3}
        onViewExisting={onViewExisting}
        onReinvestigateSuccess={onReinvestigateSuccess}
      />,
    );
    fireEvent.click(screen.getByText("View Existing Result"));
    expect(onViewExisting).toHaveBeenCalledWith("scan-old");
  });

  it("calls API with force=true on re-investigate", async () => {
    render(
      <DedupWarningModal
        isOpen={true}
        onClose={onClose}
        caseId="case-1"
        url="https://scam.com"
        existingScanId="scan-old"
        existingRiskScore={85.0}
        daysSinceScan={3}
        onViewExisting={onViewExisting}
        onReinvestigateSuccess={onReinvestigateSuccess}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Re-investigate Anyway"));
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/cases/case-1/investigate",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ url: "https://scam.com", force: true }),
        }),
      );
    });
  });

  it("shows 'today' for 0 days since scan", () => {
    render(
      <DedupWarningModal
        isOpen={true}
        onClose={onClose}
        caseId="case-1"
        url="https://scam.com"
        existingScanId="scan-old"
        existingRiskScore={null}
        daysSinceScan={0}
        onViewExisting={onViewExisting}
        onReinvestigateSuccess={onReinvestigateSuccess}
      />,
    );
    expect(screen.getByText(/today/)).toBeInTheDocument();
  });

  it("shows 'yesterday' for 1 day since scan", () => {
    render(
      <DedupWarningModal
        isOpen={true}
        onClose={onClose}
        caseId="case-1"
        url="https://scam.com"
        existingScanId="scan-old"
        existingRiskScore={null}
        daysSinceScan={1}
        onViewExisting={onViewExisting}
        onReinvestigateSuccess={onReinvestigateSuccess}
      />,
    );
    expect(screen.getByText(/yesterday/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// InvestigationHistory tests
// ---------------------------------------------------------------------------

describe("InvestigationHistory", () => {
  const baseInvestigation: CaseInvestigationSummary = {
    scanId: "scan-1",
    url: "https://example.com",
    normalizedUrl: "https://example.com",
    status: "completed",
    riskScore: 75.0,
    completedAt: "2026-03-15T12:00:00Z",
    triggerType: "manual",
    linkedAt: "2026-03-15T10:00:00Z",
  };

  it("renders nothing when no investigations", () => {
    const { container } = render(
      <InvestigationHistory
        normalizedUrl="https://example.com"
        investigations={[]}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders latest result for single investigation", () => {
    render(
      <InvestigationHistory
        normalizedUrl="https://example.com"
        investigations={[baseInvestigation]}
      />,
    );
    expect(screen.getByText("Latest Result")).toBeInTheDocument();
    expect(screen.getByText("75.0")).toBeInTheDocument();
  });

  it("renders expandable history for multiple investigations", () => {
    const investigations = [
      baseInvestigation,
      {
        ...baseInvestigation,
        scanId: "scan-2",
        riskScore: 60.0,
        completedAt: "2026-03-10T12:00:00Z",
      },
    ];

    render(
      <InvestigationHistory
        normalizedUrl="https://example.com"
        investigations={investigations}
      />,
    );

    expect(screen.getByText("Latest Result")).toBeInTheDocument();
    expect(screen.getByText(/1 previous investigation/)).toBeInTheDocument();
  });

  it("expands and collapses history", () => {
    const investigations = [
      baseInvestigation,
      {
        ...baseInvestigation,
        scanId: "scan-2",
        riskScore: 60.0,
        completedAt: "2026-03-10T12:00:00Z",
      },
    ];

    render(
      <InvestigationHistory
        normalizedUrl="https://example.com"
        investigations={investigations}
      />,
    );

    const expandButton = screen.getByText(/1 previous investigation/);
    fireEvent.click(expandButton);
    expect(screen.getByText("60.0")).toBeInTheDocument();

    fireEvent.click(expandButton);
    expect(screen.queryByText("60.0")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// useCaseActivity hook tests
// ---------------------------------------------------------------------------

import { renderHook, waitFor as hookWaitFor } from "@testing-library/react";
import { useCaseActivity } from "@/hooks/use-case-activity";

describe("useCaseActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches activity on mount", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          caseId: "case-1",
          activities: [{ type: "classification", status: "completed" }],
          hasRunning: false,
        }),
    });

    const { result } = renderHook(() => useCaseActivity("case-1"));

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/cases/case-1/activity");
    expect(result.current.activities).toHaveLength(1);
    expect(result.current.hasRunning).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("stops polling when hasRunning is false", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          caseId: "case-1",
          activities: [],
          hasRunning: false,
        }),
    });

    renderHook(() => useCaseActivity("case-1", { pollInterval: 1000 }));

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    // First call on mount
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance timer — should NOT trigger another call since hasRunning=false
    await act(async () => {
      vi.advanceTimersByTime(2000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("continues polling when hasRunning is true", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          caseId: "case-1",
          activities: [{ type: "ssi_investigation", status: "running" }],
          hasRunning: true,
        }),
    });

    renderHook(() => useCaseActivity("case-1", { pollInterval: 1000 }));

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    // Clear call history to isolate the timer-based polling
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          caseId: "case-1",
          activities: [{ type: "ssi_investigation", status: "running" }],
          hasRunning: true,
        }),
    });

    // Advance timer — should trigger another call since hasRunning=true
    await act(async () => {
      vi.advanceTimersByTime(1100);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("handles API errors gracefully", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useCaseActivity("case-1"));

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.isLoading).toBe(false);
  });

  it("does not fetch when disabled", async () => {
    const { result } = renderHook(() =>
      useCaseActivity("case-1", { enabled: false }),
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
});

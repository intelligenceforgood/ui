/**
 * Tests for SSI dedup UI:
 * - SsiDedupWarningModal component
 * - SSI page dedup flow (modal display, view existing, re-investigate)
 */
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — hoisted before component imports
// ---------------------------------------------------------------------------

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@i4g/ui-kit", () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  SectionLabel: ({ children }: any) => <span>{children}</span>,
  FeedbackButton: () => null,
}));

vi.mock("@radix-ui/react-dialog", () => ({
  Root: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  Portal: ({ children }: any) => <div>{children}</div>,
  Overlay: () => <div data-testid="overlay" />,
  Content: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Title: ({ children }: any) => <h2>{children}</h2>,
  Close: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

// Explicit icon mocks — avoid Proxy which can hang during module load.
// Factory must be self-contained (hoisted above variable declarations).
vi.mock("lucide-react", () => {
  const stub = () => null;
  return {
    AlertTriangle: stub,
    Briefcase: stub,
    CheckCircle2: stub,
    ChevronDown: stub,
    ChevronUp: stub,
    Clock: stub,
    Download: stub,
    ExternalLink: stub,
    FileSearch: stub,
    Globe: stub,
    Loader2: stub,
    Monitor: stub,
    Radio: stub,
    RefreshCw: stub,
    Search: stub,
    Shield: stub,
    ShieldAlert: stub,
    ShieldCheck: stub,
    XCircle: stub,
    Zap: stub,
  };
});

vi.mock("@/lib/use-investigation-monitor", () => ({
  useInvestigationMonitor: () => ({
    state: "disconnected",
    screenshot: null,
    events: [],
    snapshot: null,
    sendGuidance: vi.fn(),
  }),
}));

vi.mock("@/lib/format", () => ({
  parseUTCDate: (d: string) => new Date(d),
}));

// ---------------------------------------------------------------------------
// 1. SsiDedupWarningModal component tests
// ---------------------------------------------------------------------------

import { SsiDedupWarningModal } from "@/components/ssi/dedup-warning-modal";

describe("SsiDedupWarningModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    url: "https://scam.example.com",
    existingScanId: "scan-abc-123",
    existingRiskScore: 87.5,
    daysSinceScan: 3,
    onViewExisting: vi.fn(),
    onReinvestigate: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows days since scan text", () => {
    render(<SsiDedupWarningModal {...defaultProps} />);
    expect(screen.getByText("3 days ago")).toBeInTheDocument();
  });

  it("shows 'today' when daysSinceScan is 0", () => {
    render(<SsiDedupWarningModal {...defaultProps} daysSinceScan={0} />);
    expect(screen.getByText("today")).toBeInTheDocument();
  });

  it("shows 'yesterday' when daysSinceScan is 1", () => {
    render(<SsiDedupWarningModal {...defaultProps} daysSinceScan={1} />);
    expect(screen.getByText("yesterday")).toBeInTheDocument();
  });

  it("displays existing risk score", () => {
    render(<SsiDedupWarningModal {...defaultProps} />);
    expect(screen.getByText("87.5")).toBeInTheDocument();
  });

  it("calls onViewExisting and onClose when View Existing Result is clicked", () => {
    render(<SsiDedupWarningModal {...defaultProps} />);
    fireEvent.click(screen.getByText("View Existing Result"));
    expect(defaultProps.onViewExisting).toHaveBeenCalledWith("scan-abc-123");
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onReinvestigate when Re-investigate Anyway is clicked", async () => {
    render(<SsiDedupWarningModal {...defaultProps} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Re-investigate Anyway"));
    });
    expect(defaultProps.onReinvestigate).toHaveBeenCalled();
  });

  it("does not render when isOpen is false", () => {
    render(<SsiDedupWarningModal {...defaultProps} isOpen={false} />);
    expect(
      screen.queryByText("URL Already Investigated"),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2. SSI page — dedup integration
// ---------------------------------------------------------------------------

describe("SSI page – dedup flow", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("sessionStorage", {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function renderPage() {
    const mod = await import("@/app/(console)/ssi/page");
    const Page = mod.default;
    return render(<Page />);
  }

  it("shows dedup modal when API returns alreadyInvestigated", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        investigation_id: null,
        status: "skipped",
        message: "URL already investigated",
        triggered: false,
        alreadyInvestigated: true,
        existingScanId: "scan-dedup-1",
        existingRiskScore: 65.0,
        daysSinceScan: 2,
        reason: "fresh_scan_exists",
      }),
    });

    await renderPage();

    const input = screen.getByPlaceholderText(/suspicious-site\.example\.com/);
    await act(async () => {
      fireEvent.change(input, {
        target: { value: "https://scam.example.com" },
      });
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Investigate"));
    });

    await waitFor(() => {
      expect(screen.getByText("URL Already Investigated")).toBeInTheDocument();
    });
    expect(screen.getByText("2 days ago")).toBeInTheDocument();
    expect(screen.getByText("65.0")).toBeInTheDocument();
  });

  it("navigates to existing scan on View Existing Result", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        investigation_id: null,
        status: "skipped",
        triggered: false,
        alreadyInvestigated: true,
        existingScanId: "scan-nav-test",
        existingRiskScore: 90,
        daysSinceScan: 0,
      }),
    });

    await renderPage();

    const input = screen.getByPlaceholderText(/suspicious-site\.example\.com/);
    await act(async () => {
      fireEvent.change(input, { target: { value: "https://test.example" } });
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Investigate"));
    });

    await waitFor(() => {
      expect(screen.getByText("View Existing Result")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("View Existing Result"));
    expect(mockPush).toHaveBeenCalledWith("/ssi/investigations/scan-nav-test");
  });

  it("re-submits with force=true on Re-investigate Anyway", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        investigation_id: null,
        status: "skipped",
        triggered: false,
        alreadyInvestigated: true,
        existingScanId: "scan-force-test",
        existingRiskScore: 50,
        daysSinceScan: 1,
      }),
    });

    await renderPage();

    const input = screen.getByPlaceholderText(/suspicious-site\.example\.com/);
    await act(async () => {
      fireEvent.change(input, { target: { value: "https://force.example" } });
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Investigate"));
    });

    await waitFor(() => {
      expect(screen.getByText("Re-investigate Anyway")).toBeInTheDocument();
    });

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        investigation_id: "task-forced-123",
        status: "accepted",
        message: "Investigation started (forced)",
      }),
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Re-investigate Anyway"));
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
    const secondCall = fetchSpy.mock.calls[1];
    const sentBody = JSON.parse(secondCall[1].body);
    expect(sentBody.force).toBe(true);
    expect(sentBody.url).toBe("https://force.example");
  });
});

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  ArrowLeft: ({ className }: { className?: string }) => (
    <span data-testid="icon-arrow-left" className={className} />
  ),
  Clock: ({ className }: { className?: string }) => (
    <span data-testid="icon-clock" className={className} />
  ),
  Layers: ({ className }: { className?: string }) => (
    <span data-testid="icon-layers" className={className} />
  ),
  ShieldAlert: ({ className }: { className?: string }) => (
    <span data-testid="icon-shield" className={className} />
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
  FeedbackButton: () => null,
}));

// Mock apiFetch — placed before importing the component
const mockApiFetch = vi.fn();
vi.mock("@/lib/server/api-client", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

// Import the page component AFTER mocks
import CampaignDetailPage from "@/app/(console)/campaigns/[id]/page";

const campaignData = {
  id: "camp-001",
  name: "Test Campaign",
  description: "A campaign for testing",
  taxonomy_labels: { category: ["phishing", "romance_scam"] },
  taxonomy_rollup: ["phishing", "romance_scam"],
  status: "active",
  created_at: "2025-06-01T00:00:00Z",
  linked_cases: [
    {
      case_id: "case-aaaa-bbbb-cccc-111122223333",
      dataset: "intake",
      classification: "phishing",
      status: "open",
      risk_score: 8.5,
      created_at: "2025-06-01T10:00:00Z",
    },
    {
      case_id: "case-dddd-eeee-ffff-444455556666",
      dataset: "ssi",
      classification: "romance_scam",
      status: "resolved",
      risk_score: 3.2,
      created_at: "2025-05-28T08:00:00Z",
    },
  ],
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("CampaignDetailPage", () => {
  it("renders campaign name and description", async () => {
    mockApiFetch.mockResolvedValue(campaignData);
    const params = Promise.resolve({ id: "camp-001" });

    const jsx = await CampaignDetailPage({ params });
    render(jsx);

    expect(screen.getByText("Test Campaign")).toBeInTheDocument();
    expect(screen.getByText("A campaign for testing")).toBeInTheDocument();
  });

  it("renders taxonomy labels as badges", async () => {
    mockApiFetch.mockResolvedValue(campaignData);
    const params = Promise.resolve({ id: "camp-001" });

    const jsx = await CampaignDetailPage({ params });
    render(jsx);

    // "phishing" appears in both taxonomy labels and linked case classification
    const phishingElements = screen.getAllByText("phishing");
    expect(phishingElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("romance_scam").length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it("renders the active status badge", async () => {
    mockApiFetch.mockResolvedValue(campaignData);
    const params = Promise.resolve({ id: "camp-001" });

    const jsx = await CampaignDetailPage({ params });
    render(jsx);

    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("renders linked cases count", async () => {
    mockApiFetch.mockResolvedValue(campaignData);
    const params = Promise.resolve({ id: "camp-001" });

    const jsx = await CampaignDetailPage({ params });
    render(jsx);

    expect(screen.getByText("2 linked cases")).toBeInTheDocument();
  });

  it("renders linked case IDs as links", async () => {
    mockApiFetch.mockResolvedValue(campaignData);
    const params = Promise.resolve({ id: "camp-001" });

    const jsx = await CampaignDetailPage({ params });
    render(jsx);

    // case_id is truncated to first 8 chars + "..."
    expect(screen.getByText("case-aaa...")).toBeInTheDocument();
    expect(screen.getByText("case-ddd...")).toBeInTheDocument();

    const caseLinks = screen.getAllByRole("link", { name: /case-/i });
    expect(caseLinks).toHaveLength(2);
    expect(caseLinks[0].getAttribute("href")).toContain("/cases/");
  });

  it("renders risk scores with correct coloring", async () => {
    mockApiFetch.mockResolvedValue(campaignData);
    const params = Promise.resolve({ id: "camp-001" });

    const jsx = await CampaignDetailPage({ params });
    render(jsx);

    expect(screen.getByText("8.5")).toBeInTheDocument();
    expect(screen.getByText("3.2")).toBeInTheDocument();
  });

  it("renders Back to Campaigns link", async () => {
    mockApiFetch.mockResolvedValue(campaignData);
    const params = Promise.resolve({ id: "camp-001" });

    const jsx = await CampaignDetailPage({ params });
    render(jsx);

    const backLink = screen.getByText("Back to Campaigns");
    expect(backLink.closest("a")).toHaveAttribute("href", "/campaigns");
  });

  it("shows error when campaign not found", async () => {
    mockApiFetch.mockRejectedValue(new Error("Not found"));
    const params = Promise.resolve({ id: "nonexistent" });

    const jsx = await CampaignDetailPage({ params });
    render(jsx);

    expect(screen.getByText("Campaign not found.")).toBeInTheDocument();
  });

  it("renders empty cases state", async () => {
    mockApiFetch.mockResolvedValue({
      ...campaignData,
      linked_cases: [],
    });
    const params = Promise.resolve({ id: "camp-001" });

    const jsx = await CampaignDetailPage({ params });
    render(jsx);

    expect(
      screen.getByText("No cases linked to this campaign yet."),
    ).toBeInTheDocument();
  });
});

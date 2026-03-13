import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EntityExplorer from "@/app/(console)/intelligence/entities/entity-explorer";
import { useRouter, useSearchParams } from "next/navigation";
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
  ArrowUpDown: () => <span data-testid="icon-sort" />,
  ChevronLeft: () => <span data-testid="icon-left" />,
  ChevronRight: () => <span data-testid="icon-right" />,
  Download: () => <span data-testid="icon-download" />,
  Search: () => <span data-testid="icon-search" />,
  X: () => <span data-testid="icon-x" />,
}));

vi.mock("@/app/(console)/intelligence/entities/entity-filter-sidebar", () => ({
  EntityFilterSidebar: (props: any) => (
    <div data-testid="filter-sidebar">
      <button onClick={props.onClear}>Clear</button>
    </div>
  ),
}));

vi.mock("@/app/(console)/intelligence/entities/entity-detail-panel", () => ({
  EntityDetailPanel: (props: any) => (
    <div data-testid="detail-panel">{props.entity?.canonicalValue}</div>
  ),
}));

const mockEntities = {
  items: [
    {
      entityType: "crypto_wallet",
      canonicalValue: "0xABCDEF",
      caseCount: 5,
      firstSeenAt: "2025-01-01",
      lastActiveAt: "2025-06-01",
      lossSum: 150000,
      riskScore: 0.85,
      status: "active",
    },
    {
      entityType: "bank_account",
      canonicalValue: "1234567890",
      caseCount: 2,
      firstSeenAt: "2025-03-01",
      lastActiveAt: "2025-05-01",
      lossSum: 45000,
      riskScore: 0.45,
      status: "dormant",
    },
  ],
  count: 2,
  total: 2,
  limit: 25,
  offset: 0,
};

let fetchMock: Mock;

describe("EntityExplorer", () => {
  beforeEach(() => {
    (useRouter as Mock).mockReturnValue({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
    });
    (useSearchParams as Mock).mockReturnValue(new URLSearchParams());

    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockEntities,
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the entity table after fetch", async () => {
    render(<EntityExplorer initialParams={{}} />);

    await waitFor(() => {
      expect(screen.getByText("0xABCDEF")).toBeInTheDocument();
    });

    expect(screen.getByText("1234567890")).toBeInTheDocument();
  });

  it("fetches entities on mount", async () => {
    render(<EntityExplorer initialParams={{}} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/intelligence/entities"),
      );
    });
  });

  it("renders the search input", () => {
    render(<EntityExplorer initialParams={{}} />);
    expect(screen.getByPlaceholderText(/search entities/i)).toBeInTheDocument();
  });

  it("renders filter sidebar", () => {
    render(<EntityExplorer initialParams={{}} />);
    expect(screen.getByTestId("filter-sidebar")).toBeInTheDocument();
  });

  it("renders export CSV link", () => {
    render(<EntityExplorer initialParams={{}} />);
    expect(screen.getByText(/export csv/i)).toBeInTheDocument();
  });

  it("filters entities client-side by search query", async () => {
    render(<EntityExplorer initialParams={{}} />);

    await waitFor(() => {
      expect(screen.getByText("0xABCDEF")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search entities/i);
    fireEvent.change(searchInput, { target: { value: "crypto" } });

    expect(screen.getByText("0xABCDEF")).toBeInTheDocument();
    expect(screen.queryByText("1234567890")).not.toBeInTheDocument();
  });

  it("shows loading state", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    render(<EntityExplorer initialParams={{}} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("passes initial params as filter state", async () => {
    render(<EntityExplorer initialParams={{ entity_type: "bank_account" }} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("entity_type=bank_account"),
      );
    });
  });
});

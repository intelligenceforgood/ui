import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import IndicatorRegistry from "@/app/(console)/intelligence/indicators/indicator-registry";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

vi.mock("@i4g/ui-kit", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Input: (props: any) => <input {...props} />,
}));

vi.mock("lucide-react", () => ({
  ChevronLeft: () => <span />,
  ChevronRight: () => <span />,
  Download: () => <span />,
  Search: () => <span />,
  Send: () => <span />,
  Tag: () => <span />,
  X: () => <span />,
}));

const mockIndicators = {
  items: [
    {
      indicatorId: "ind-001",
      indicatorValue: "192.168.1.1",
      category: "ip_address",
      caseCount: 3,
      lossSum: 50000,
      status: "active",
    },
    {
      indicatorId: "ind-002",
      indicatorValue: "9876543210",
      category: "bank_account",
      caseCount: 7,
      lossSum: 200000,
      status: "active",
    },
  ],
  count: 2,
  total: 2,
  limit: 25,
  offset: 0,
};

let fetchMock: Mock;

describe("IndicatorRegistry", () => {
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockIndicators,
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders indicator list after fetch", async () => {
    render(<IndicatorRegistry initialParams={{}} />);

    await waitFor(() => {
      expect(screen.getByText("192.168.1.1")).toBeInTheDocument();
    });
    expect(screen.getByText("9876543210")).toBeInTheDocument();
  });

  it("renders segmentation tabs", async () => {
    render(<IndicatorRegistry initialParams={{}} />);

    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Bank")).toBeInTheDocument();
    expect(screen.getByText("Crypto")).toBeInTheDocument();
    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByText("IP")).toBeInTheDocument();
    expect(screen.getByText("Domain")).toBeInTheDocument();
  });

  it("switches tab and re-fetches with category", async () => {
    render(<IndicatorRegistry initialParams={{}} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const bankTab = screen.getByText("Bank");
    fireEvent.click(bankTab);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("category=bank_account"),
      );
    });
  });

  it("renders bulk action buttons", async () => {
    render(<IndicatorRegistry initialParams={{}} />);

    await waitFor(() => {
      expect(screen.getByText("192.168.1.1")).toBeInTheDocument();
    });

    // Select a row to reveal bulk actions
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]); // first row checkbox (index 0 is select-all)

    // Bulk actions visible (export buttons)
    expect(screen.getByText(/export xlsx/i)).toBeInTheDocument();
  });

  it("fetches indicators on mount", async () => {
    render(<IndicatorRegistry initialParams={{}} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/intelligence/indicators"),
      );
    });
  });

  it("renders search input", () => {
    render(<IndicatorRegistry initialParams={{}} />);
    expect(
      screen.getByPlaceholderText(/search indicators/i),
    ).toBeInTheDocument();
  });

  it("filters indicators client-side by search query", async () => {
    render(<IndicatorRegistry initialParams={{}} />);

    await waitFor(() => {
      expect(screen.getByText("192.168.1.1")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search indicators/i);
    fireEvent.change(searchInput, { target: { value: "192.168" } });

    expect(screen.getByText("192.168.1.1")).toBeInTheDocument();
    expect(screen.queryByText("9876543210")).not.toBeInTheDocument();
  });

  it("shows loading state", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    render(<IndicatorRegistry initialParams={{}} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("applies initial category from params", async () => {
    render(<IndicatorRegistry initialParams={{ category: "crypto_wallet" }} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("category=crypto_wallet"),
      );
    });
  });
});

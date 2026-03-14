import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
}));

vi.mock("lucide-react", () => ({
  Bell: () => <span data-testid="icon-bell" />,
  BellOff: () => <span data-testid="icon-bell-off" />,
  Eye: () => <span data-testid="icon-eye" />,
  Trash2: () => <span data-testid="icon-trash" />,
  RefreshCw: () => <span data-testid="icon-refresh" />,
  AlertTriangle: () => <span data-testid="icon-alert-triangle" />,
  CheckCircle2: () => <span data-testid="icon-check" />,
}));

import WatchlistExplorer from "@/app/(console)/intelligence/watchlist/watchlist-explorer";

const mockItems = {
  items: [
    {
      watchlistId: "wl-1",
      entityType: "wallet",
      canonicalValue: "0xAAA",
      alertOnNewCase: true,
      alertOnLossIncrease: false,
      lossThreshold: null,
      note: "Test note",
      createdBy: "user@test.com",
      createdAt: "2025-01-01T00:00:00Z",
    },
    {
      watchlistId: "wl-2",
      entityType: "email",
      canonicalValue: "bad@scam.com",
      alertOnNewCase: false,
      alertOnLossIncrease: true,
      lossThreshold: 5000,
      note: null,
      createdBy: "user@test.com",
      createdAt: "2025-01-02T00:00:00Z",
    },
  ],
};

const mockAlerts = [
  {
    alertId: "a-1",
    watchlistId: "wl-1",
    alertType: "new_case",
    message: "New case linked to 0xAAA",
    isRead: false,
    createdAt: "2025-01-05T00:00:00Z",
  },
];

let fetchMock: Mock;

describe("WatchlistExplorer", () => {
  beforeEach(() => {
    fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/watchlist/alerts")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockAlerts,
        });
      }
      if (url.includes("/watchlist")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockItems,
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders watchlist items from API", async () => {
    render(<WatchlistExplorer />);
    await waitFor(() => {
      expect(screen.getByText("0xAAA")).toBeInTheDocument();
      expect(screen.getByText("bad@scam.com")).toBeInTheDocument();
    });
  });

  it("shows entity count", async () => {
    render(<WatchlistExplorer />);
    await waitFor(() => {
      expect(screen.getByText("2 watched entities")).toBeInTheDocument();
    });
  });

  it("renders unread alerts section", async () => {
    render(<WatchlistExplorer />);
    await waitFor(() => {
      expect(screen.getByText("Unread Alerts")).toBeInTheDocument();
      expect(screen.getByText("New case linked to 0xAAA")).toBeInTheDocument();
    });
  });

  it("shows item note when present", async () => {
    render(<WatchlistExplorer />);
    await waitFor(() => {
      expect(screen.getByText("Test note")).toBeInTheDocument();
    });
  });

  it("calls DELETE API when remove button clicked", async () => {
    fetchMock.mockImplementation((url: string, opts?: any) => {
      if (opts?.method === "DELETE") {
        return Promise.resolve({ ok: true });
      }
      if (url.includes("/watchlist/alerts")) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockItems,
      });
    });

    render(<WatchlistExplorer />);
    await waitFor(() => {
      expect(screen.getByText("0xAAA")).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByTitle("Remove from watchlist");
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/intelligence/watchlist/wl-1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  it("handles API error gracefully", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/watchlist/alerts")) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.resolve({ ok: false, status: 500 });
    });

    render(<WatchlistExplorer />);
    await waitFor(() => {
      expect(screen.getByText("HTTP 500")).toBeInTheDocument();
    });
  });

  it("shows empty state when no items", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/watchlist/alerts")) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ items: [] }),
      });
    });

    render(<WatchlistExplorer />);
    await waitFor(() => {
      expect(
        screen.getByText(/No entities on your watchlist/),
      ).toBeInTheDocument();
    });
  });
});

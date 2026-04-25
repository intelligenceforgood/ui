import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

import DiscoveriesExplorer from "@/app/(console)/discoveries/discoveries-explorer";

const makeRow = (
  overrides: Partial<{
    discoveryId: string;
    domain: string;
    seenAt: string;
    source: string;
    filterMatch: boolean;
    filterReason: string | null;
    enqueuedScanId: string | null;
    dismissedAt: string | null;
    dismissReason: string | null;
  }> = {},
) => ({
  discoveryId: "disc-1",
  domain: "evil-brand.com",
  seenAt: "2026-04-25T10:00:00Z",
  source: "merklemap",
  filterMatch: true,
  filterReason: "brand keyword",
  enqueuedScanId: null,
  dismissedAt: null,
  dismissReason: null,
  ...overrides,
});

const makeListResponse = (
  items: ReturnType<typeof makeRow>[],
  total?: number,
) => ({
  items,
  total: total ?? items.length,
  limit: 50,
  offset: 0,
});

let fetchMock: Mock;

describe("DiscoveriesExplorer", () => {
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => makeListResponse([makeRow()]),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading state initially", () => {
    // Don't resolve fetch yet — render synchronously
    fetchMock.mockReturnValue(new Promise(() => {}));
    render(<DiscoveriesExplorer />);
    expect(screen.getByTestId("loading-state")).toBeInTheDocument();
  });

  it("renders empty state when API returns items: []", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => makeListResponse([]),
    });
    render(<DiscoveriesExplorer />);
    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    });
    expect(
      screen.getByText("No active discoveries — all caught up."),
    ).toBeInTheDocument();
  });

  it("renders rows with domain, seen-at, status badges", async () => {
    render(<DiscoveriesExplorer />);
    await waitFor(() => {
      expect(screen.getByText("evil-brand.com")).toBeInTheDocument();
    });
    expect(screen.getByText("Pending")).toBeInTheDocument();
    // seenAt formatted — just confirm it rendered something (locale-dependent)
    expect(screen.getByTestId("row-disc-1")).toBeInTheDocument();
  });

  it("renders error banner when GET /discoveries returns 500", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    render(<DiscoveriesExplorer />);
    await waitFor(() => {
      expect(screen.getByTestId("error-banner")).toBeInTheDocument();
    });
    expect(screen.getByText(/HTTP 500/)).toBeInTheDocument();
  });

  it("enqueue button posts to /api/discoveries/{id}/enqueue and updates row to 'Enqueued' badge with scan id", async () => {
    const row = makeRow();
    fetchMock.mockImplementation((url: string, opts?: RequestInit) => {
      if (opts?.method === "POST" && url.includes("/enqueue")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            discoveryId: row.discoveryId,
            enqueuedScanId: "scan-abc",
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => makeListResponse([row]),
      });
    });

    render(<DiscoveriesExplorer />);
    await waitFor(() => {
      expect(
        screen.getByTestId(`enqueue-btn-${row.discoveryId}`),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId(`enqueue-btn-${row.discoveryId}`));

    await waitFor(() => {
      expect(screen.getByText(/Enqueued scan-abc/)).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/discoveries/${row.discoveryId}/enqueue`,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("enqueue button surfaces 409 inline when API returns 'Discovery already enqueued'", async () => {
    const row = makeRow();
    fetchMock.mockImplementation((url: string, opts?: RequestInit) => {
      if (opts?.method === "POST" && url.includes("/enqueue")) {
        return Promise.resolve({ ok: false, status: 409 });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => makeListResponse([row]),
      });
    });

    render(<DiscoveriesExplorer />);
    await waitFor(() => {
      expect(
        screen.getByTestId(`enqueue-btn-${row.discoveryId}`),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(`enqueue-btn-${row.discoveryId}`));

    await waitFor(() => {
      expect(
        screen.getByTestId(`row-error-${row.discoveryId}`),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Already enqueued")).toBeInTheDocument();
  });

  it("enqueue button surfaces 404 inline when API returns 'Discovery not found'", async () => {
    const row = makeRow();
    fetchMock.mockImplementation((url: string, opts?: RequestInit) => {
      if (opts?.method === "POST" && url.includes("/enqueue")) {
        return Promise.resolve({ ok: false, status: 404 });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => makeListResponse([row]),
      });
    });

    render(<DiscoveriesExplorer />);
    await waitFor(() => {
      expect(
        screen.getByTestId(`enqueue-btn-${row.discoveryId}`),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(`enqueue-btn-${row.discoveryId}`));

    await waitFor(() => {
      expect(
        screen.getByTestId(`row-error-${row.discoveryId}`),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("Discovery not found — refresh the list"),
    ).toBeInTheDocument();
  });

  it("dismiss flow opens reason input and posts to /api/discoveries/{id}/dismiss with the entered reason", async () => {
    const row = makeRow();
    fetchMock.mockImplementation((url: string, opts?: RequestInit) => {
      if (opts?.method === "POST" && url.includes("/dismiss")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ...row, dismissedAt: "2026-04-25T11:00:00Z" }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => makeListResponse([row]),
      });
    });

    render(<DiscoveriesExplorer />);
    await waitFor(() => {
      expect(
        screen.getByTestId(`dismiss-open-btn-${row.discoveryId}`),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId(`dismiss-open-btn-${row.discoveryId}`));
    await waitFor(() => {
      expect(
        screen.getByTestId(`dismiss-reason-${row.discoveryId}`),
      ).toBeInTheDocument();
    });

    const input = screen.getByTestId(`dismiss-reason-${row.discoveryId}`);
    await userEvent.type(input, "not relevant");

    fireEvent.click(
      screen.getByTestId(`dismiss-confirm-btn-${row.discoveryId}`),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/discoveries/${row.discoveryId}/dismiss`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ reason: "not relevant" }),
        }),
      );
    });
  });

  it("dismiss flow surfaces 422 inline when reason exceeds 500 chars (server-rejected)", async () => {
    const row = makeRow();
    fetchMock.mockImplementation((url: string, opts?: RequestInit) => {
      if (opts?.method === "POST" && url.includes("/dismiss")) {
        return Promise.resolve({ ok: false, status: 422 });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => makeListResponse([row]),
      });
    });

    render(<DiscoveriesExplorer />);
    await waitFor(() => {
      expect(
        screen.getByTestId(`dismiss-open-btn-${row.discoveryId}`),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId(`dismiss-open-btn-${row.discoveryId}`));
    await waitFor(() => {
      expect(
        screen.getByTestId(`dismiss-confirm-btn-${row.discoveryId}`),
      ).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByTestId(`dismiss-confirm-btn-${row.discoveryId}`),
    );

    await waitFor(() => {
      expect(
        screen.getByTestId(`row-error-${row.discoveryId}`),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("Reason is too long (max 500 characters)"),
    ).toBeInTheDocument();
  });

  it("dismiss success removes the row from the list", async () => {
    const row = makeRow();
    fetchMock.mockImplementation((url: string, opts?: RequestInit) => {
      if (opts?.method === "POST" && url.includes("/dismiss")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ ...row, dismissedAt: "2026-04-25T11:00:00Z" }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => makeListResponse([row]),
      });
    });

    render(<DiscoveriesExplorer />);
    await waitFor(() => {
      expect(screen.getByText("evil-brand.com")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId(`dismiss-open-btn-${row.discoveryId}`));
    await waitFor(() => {
      expect(
        screen.getByTestId(`dismiss-confirm-btn-${row.discoveryId}`),
      ).toBeInTheDocument();
    });
    fireEvent.click(
      screen.getByTestId(`dismiss-confirm-btn-${row.discoveryId}`),
    );

    await waitFor(() => {
      expect(screen.queryByText("evil-brand.com")).not.toBeInTheDocument();
    });
  });

  it("pagination Next button increments offset and refetches", async () => {
    const rows = Array.from({ length: 50 }, (_, i) =>
      makeRow({ discoveryId: `disc-${i}`, domain: `domain-${i}.com` }),
    );
    fetchMock.mockImplementation((url: string) => {
      const u = new URL(url, "http://localhost");
      const offset = Number(u.searchParams.get("offset") ?? "0");
      const pageRows =
        offset === 0
          ? rows
          : [makeRow({ discoveryId: "disc-50", domain: "domain-50.com" })];
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          items: pageRows,
          total: 51,
          limit: 50,
          offset,
        }),
      });
    });

    render(<DiscoveriesExplorer />);
    await waitFor(() => {
      expect(screen.getByTestId("pagination-next")).toBeInTheDocument();
    });

    // Prev should be disabled at offset=0
    expect(screen.getByTestId("pagination-prev")).toBeDisabled();

    fireEvent.click(screen.getByTestId("pagination-next"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("offset=50"),
      );
    });
  });

  it("pagination Prev button is disabled at offset=0", async () => {
    render(<DiscoveriesExplorer />);
    await waitFor(() => {
      expect(screen.getByTestId("pagination-prev")).toBeInTheDocument();
    });
    expect(screen.getByTestId("pagination-prev")).toBeDisabled();
  });
});

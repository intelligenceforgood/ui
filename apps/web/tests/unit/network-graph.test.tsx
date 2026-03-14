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

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<any>) => {
    const Component = (props: any) => <div data-testid="dynamic-component" />;
    return Component;
  },
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
  Network: () => <span data-testid="icon-network" />,
  ZoomIn: () => <span data-testid="icon-zoom-in" />,
  ZoomOut: () => <span data-testid="icon-zoom-out" />,
  Download: () => <span data-testid="icon-download" />,
  Search: () => <span data-testid="icon-search" />,
  Maximize2: () => <span data-testid="icon-maximize" />,
}));

import NetworkGraph from "@/app/(console)/intelligence/graph/network-graph";

const mockGraphResponse = {
  nodes: [
    {
      id: "wallet:0xAAA",
      entityType: "wallet",
      label: "0xAAA",
      caseCount: 5,
      riskScore: 85,
    },
    {
      id: "wallet:0xBBB",
      entityType: "wallet",
      label: "0xBBB",
      caseCount: 2,
      riskScore: 30,
    },
    {
      id: "email:a@b.com",
      entityType: "email",
      label: "a@b.com",
      caseCount: 3,
      riskScore: 60,
    },
  ],
  edges: [
    {
      source: "wallet:0xAAA",
      target: "wallet:0xBBB",
      weight: 2,
      edgeType: "co-occurrence",
    },
    {
      source: "wallet:0xAAA",
      target: "email:a@b.com",
      weight: 1,
      edgeType: "shared-ip",
    },
  ],
  nodeCount: 3,
  edgeCount: 2,
  layout: null,
};

let fetchMock: Mock;

describe("NetworkGraph", () => {
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGraphResponse,
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      setLineDash: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 40 }),
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      canvas: { width: 800, height: 600 },
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the graph container", async () => {
    render(<NetworkGraph />);
    await waitFor(() => {
      expect(
        screen.getByText(/network graph/i) || screen.getByRole("textbox"),
      ).toBeTruthy();
    });
  });

  it("renders seed input control", () => {
    render(<NetworkGraph />);
    const input = screen.getByPlaceholderText("entity_type:value");
    expect(input).toBeInTheDocument();
  });

  it("renders hop selector", () => {
    render(<NetworkGraph />);
    expect(
      screen.getByText(/1/) || screen.getByText(/hops/i),
    ).toBeInTheDocument();
  });

  it("fetches graph data on submit", async () => {
    render(<NetworkGraph />);

    const input = screen.getByPlaceholderText("entity_type:value");
    fireEvent.change(input, { target: { value: "wallet:0xAAA" } });

    const submitBtn = screen.getByTestId("icon-search").closest("button")!;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/intelligence/graph"),
      );
    });
  });
});

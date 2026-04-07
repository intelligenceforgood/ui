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
  Crosshair: () => <span data-testid="icon-crosshair" />,
  Download: () => <span data-testid="icon-download" />,
  ExternalLink: () => <span data-testid="icon-external-link" />,
  HelpCircle: () => <span data-testid="icon-help" />,
  Maximize2: () => <span data-testid="icon-maximize" />,
  Network: () => <span data-testid="icon-network" />,
  Search: () => <span data-testid="icon-search" />,
  X: () => <span data-testid="icon-x" />,
  ZoomIn: () => <span data-testid="icon-zoom-in" />,
  ZoomOut: () => <span data-testid="icon-zoom-out" />,
}));

import { useSearchParams } from "next/navigation";
import NetworkGraph from "@/app/(console)/intelligence/graph/network-graph";

const mockGraphWithClusters = {
  nodes: [
    {
      id: "wallet:0xAAA",
      entityType: "wallet",
      label: "0xAAA",
      caseCount: 5,
      riskScore: 85,
      clusterId: 0,
    },
    {
      id: "wallet:0xBBB",
      entityType: "wallet",
      label: "0xBBB",
      caseCount: 2,
      riskScore: 30,
      clusterId: 0,
    },
    {
      id: "email:a@b.com",
      entityType: "email",
      label: "a@b.com",
      caseCount: 3,
      riskScore: 60,
      clusterId: 1,
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
      edgeType: "shared-registrar",
    },
  ],
  clusters: [
    { clusterId: 0, label: "Cluster A", nodeCount: 2, topRiskScore: 85 },
    { clusterId: 1, label: "Cluster B", nodeCount: 1, topRiskScore: 60 },
  ],
  nodeCount: 3,
  edgeCount: 2,
  layout: null,
};

const mockEntityTypes = [
  { value: "wallet_address", label: "Wallet Address" },
  { value: "email_address", label: "Email Address" },
  { value: "phone_number", label: "Phone Number" },
];

let fetchMock: Mock;

describe("NetworkGraph – cluster visualization", () => {
  beforeEach(() => {
    (useSearchParams as Mock).mockReturnValue(new URLSearchParams());

    fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("type-labels")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockEntityTypes,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockGraphWithClusters,
      });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

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
      strokeRect: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      canvas: { width: 800, height: 600 },
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Show Communities checkbox after data loads", async () => {
    render(<NetworkGraph />);

    // Wait for entity types to load, then trigger data load
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter value…")).toBeInTheDocument();
    });
    const valueInput = screen.getByPlaceholderText("Enter value…");
    fireEvent.change(valueInput, { target: { value: "0xAAA" } });
    const submitBtn = screen.getByTestId("icon-search").closest("button")!;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const checkbox = screen.getByLabelText("Show Communities");
      expect(checkbox).toBeInTheDocument();
    });
  });

  it("renders the edge type legend entries for infrastructure edges", async () => {
    render(<NetworkGraph />);

    // Load data by submitting a seed
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter value…")).toBeInTheDocument();
    });
    const valueInput = screen.getByPlaceholderText("Enter value…");
    fireEvent.change(valueInput, { target: { value: "0xAAA" } });
    const submitBtn = screen.getByTestId("icon-search").closest("button")!;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    // The edge legend should mention infrastructure edge types
    await waitFor(() => {
      expect(screen.getByText("co-occurrence")).toBeInTheDocument();
    });
  });

  it("sends graph API request with correct endpoint", async () => {
    render(<NetworkGraph />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter value…")).toBeInTheDocument();
    });
    const valueInput = screen.getByPlaceholderText("Enter value…");
    fireEvent.change(valueInput, { target: { value: "0xAAA" } });
    const submitBtn = screen.getByTestId("icon-search").closest("button")!;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/intelligence/graph"),
      );
    });
  });
});

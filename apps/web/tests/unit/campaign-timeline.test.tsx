import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock recharts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

// Mock @i4g/ui-kit
vi.mock("@i4g/ui-kit", () => ({
  Card: ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}));

import CampaignTimeline from "@/app/(console)/intelligence/campaigns/[id]/campaign-timeline";

const sampleTimeline = [
  { date: "2025-06-01", caseCount: 3 },
  { date: "2025-06-02", caseCount: 5 },
];

const sampleGraph = {
  nodes: [
    {
      id: "n1",
      label: "Entity A",
      entityType: "wallet",
      riskScore: 50,
      caseCount: 1,
    },
    {
      id: "n2",
      label: "Entity B",
      entityType: "domain",
      riskScore: 50,
      caseCount: 1,
    },
  ],
  edges: [{ source: "n1", target: "n2", weight: 1, edgeType: "linked" }],
};

const sampleEntityTypes = ["wallet", "domain", "ip"];

describe("CampaignTimeline", () => {
  it("renders two cards (timeline and entity network)", () => {
    render(
      <CampaignTimeline
        timeline={sampleTimeline}
        graph={sampleGraph}
        entityTypes={sampleEntityTypes}
      />,
    );
    expect(screen.getAllByTestId("card")).toHaveLength(2);
  });

  it("renders section headings", () => {
    render(
      <CampaignTimeline
        timeline={sampleTimeline}
        graph={sampleGraph}
        entityTypes={sampleEntityTypes}
      />,
    );
    expect(screen.getByText("Case timeline")).toBeDefined();
    expect(screen.getByText("Entity network")).toBeDefined();
  });

  it("displays graph node and edge counts", () => {
    render(
      <CampaignTimeline
        timeline={sampleTimeline}
        graph={sampleGraph}
        entityTypes={sampleEntityTypes}
      />,
    );
    expect(screen.getByText("2 nodes, 1 edges")).toBeDefined();
  });

  it("shows entity type labels", () => {
    render(
      <CampaignTimeline
        timeline={sampleTimeline}
        graph={sampleGraph}
        entityTypes={sampleEntityTypes}
      />,
    );
    expect(screen.getByText("wallet")).toBeDefined();
    expect(screen.getByText("domain")).toBeDefined();
    expect(screen.getByText("ip")).toBeDefined();
  });

  it("renders with empty data without crashing", () => {
    render(
      <CampaignTimeline
        timeline={[]}
        graph={{ nodes: [], edges: [] }}
        entityTypes={[]}
      />,
    );
    expect(screen.getAllByTestId("card")).toHaveLength(2);
  });
});

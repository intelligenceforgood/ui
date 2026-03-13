import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock recharts — render simplified chart components
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  BarChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  AreaChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Area: () => <div data-testid="area" />,
  Funnel: () => <div data-testid="funnel" />,
  FunnelChart: ({ children }: { children: ReactNode }) => (
    <div data-testid="funnel-chart">{children}</div>
  ),
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
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

import ImpactCharts from "@/app/(console)/impact/impact-charts";

const sampleLoss = [
  { label: "Investment Scam", lossSum: 250000, caseCount: 12 },
  { label: "Romance Scam", lossSum: 180000, caseCount: 8 },
];

const sampleVelocity = [
  { period: "2025-W20", proactive: 10, reactive: 5, total: 15 },
  { period: "2025-W21", proactive: 12, reactive: 3, total: 15 },
];

const sampleFunnel = [
  { stage: "Intake", count: 500 },
  { stage: "Ingestion", count: 400 },
  { stage: "Classification", count: 350 },
  { stage: "Review", count: 200 },
  { stage: "Action", count: 150 },
];

const sampleCumulative = [
  {
    period: "2025-W20",
    bank: 5,
    crypto: 3,
    domain: 2,
    ip: 1,
    other: 0,
    total: 11,
  },
  {
    period: "2025-W21",
    bank: 8,
    crypto: 5,
    domain: 4,
    ip: 2,
    other: 1,
    total: 20,
  },
];

describe("ImpactCharts", () => {
  it("renders four chart cards", () => {
    render(
      <ImpactCharts
        lossByTaxonomy={sampleLoss}
        velocity={sampleVelocity}
        funnel={sampleFunnel}
        cumulative={sampleCumulative}
      />,
    );
    const cards = screen.getAllByTestId("card");
    expect(cards).toHaveLength(4);
  });

  it("renders chart section headings", () => {
    render(
      <ImpactCharts
        lossByTaxonomy={sampleLoss}
        velocity={sampleVelocity}
        funnel={sampleFunnel}
        cumulative={sampleCumulative}
      />,
    );
    expect(screen.getByText("Loss by fraud type")).toBeDefined();
    expect(screen.getByText("Detection velocity")).toBeDefined();
    expect(screen.getByText("Pipeline funnel")).toBeDefined();
    expect(screen.getByText("Cumulative indicators")).toBeDefined();
  });

  it("renders with empty data without crashing", () => {
    render(
      <ImpactCharts
        lossByTaxonomy={[]}
        velocity={[]}
        funnel={[]}
        cumulative={[]}
      />,
    );
    expect(screen.getAllByTestId("card")).toHaveLength(4);
  });
});

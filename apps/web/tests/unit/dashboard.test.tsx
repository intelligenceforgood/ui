import React from "react";
import { render, screen } from "@testing-library/react";
import { DashboardKpiCards } from "@/components/dashboard-kpi-cards";
import { describe, expect, it, vi } from "vitest";

vi.mock("@i4g/ui-kit", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@i4g/ui-kit")>();
  return {
    ...mod,
    ProgressRing: ({ value }: { value: number }) => (
      <div data-testid="progress-ring">Ring: {value}</div>
    ),
  };
});

describe("DashboardKpiCards", () => {
  it("renders metrics properly", () => {
    const metrics = [
      { label: "Campaign risk scores", value: "42", change: "+5" },
      { label: "Loss linkages", value: "100", change: "-2" },
      {
        label: "Engagement completion",
        value: "75%",
        change: "3 of 4 cases closed",
      },
    ];

    render(<DashboardKpiCards metrics={metrics} />);

    expect(screen.getByText("Campaign risk scores")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("+5")).toBeInTheDocument();

    expect(screen.getByText("Loss linkages")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("-2")).toBeInTheDocument();

    expect(screen.getByText("Engagement completion")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("3 of 4 cases closed")).toBeInTheDocument();
    expect(screen.getByTestId("progress-ring")).toHaveTextContent("Ring: 75");
  });
});

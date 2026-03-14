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
  FeedbackButton: () => <div data-testid="feedback-button" />,
}));

vi.mock("lucide-react", () => ({
  CalendarClock: () => <span data-testid="icon-calendar" />,
  FileText: () => <span data-testid="icon-file" />,
  Loader2: () => <span data-testid="icon-loader" />,
}));

import ReportBuilderPage from "@/app/(console)/reports/builder/page";

let fetchMock: Mock;

describe("ReportBuilderPage", () => {
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reportId: "r-1", status: "queued" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders template selection cards", () => {
    render(<ReportBuilderPage />);
    expect(screen.getByText("Executive Impact Summary")).toBeInTheDocument();
    expect(screen.getByText("LEA Evidence Dossier")).toBeInTheDocument();
  });

  it("renders mode toggle buttons", () => {
    render(<ReportBuilderPage />);
    expect(screen.getByText("Generate Now")).toBeInTheDocument();
    expect(screen.getByText("Schedule")).toBeInTheDocument();
  });

  it("hides schedule fields in generate mode", () => {
    render(<ReportBuilderPage />);
    expect(screen.queryByLabelText("Cadence")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Recipients/)).not.toBeInTheDocument();
  });

  it("shows schedule fields when Schedule mode selected", () => {
    render(<ReportBuilderPage />);
    fireEvent.click(screen.getByText("Schedule"));
    expect(screen.getByLabelText("Cadence")).toBeInTheDocument();
    expect(screen.getByLabelText(/Recipients/)).toBeInTheDocument();
  });

  it("submits generate request correctly", async () => {
    render(<ReportBuilderPage />);

    // Select template
    fireEvent.click(screen.getByText("Executive Impact Summary"));

    // Submit
    fireEvent.click(screen.getByText("Generate Report"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/reports/generate",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("executive_summary"),
        }),
      );
    });
  });

  it("shows success message after generation", async () => {
    render(<ReportBuilderPage />);
    fireEvent.click(screen.getByText("Executive Impact Summary"));
    fireEvent.click(screen.getByText("Generate Report"));

    await waitFor(() => {
      expect(
        screen.getByText("Report queued successfully."),
      ).toBeInTheDocument();
    });
  });

  it("submits schedule request correctly", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ scheduleId: "s-1" }),
    });

    render(<ReportBuilderPage />);

    // Switch to schedule mode
    fireEvent.click(screen.getByText("Schedule"));

    // Select template
    fireEvent.click(screen.getByText("Executive Impact Summary"));

    // Set cadence
    fireEvent.change(screen.getByLabelText("Cadence"), {
      target: { value: "daily" },
    });

    // Set recipients
    fireEvent.change(screen.getByLabelText(/Recipients/), {
      target: { value: "a@b.com, c@d.com" },
    });

    // Submit
    fireEvent.click(screen.getByText("Create Schedule"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/reports/schedules",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("daily"),
        }),
      );
    });
  });

  it("shows schedule success message", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ scheduleId: "s-1" }),
    });

    render(<ReportBuilderPage />);
    fireEvent.click(screen.getByText("Schedule"));
    fireEvent.click(screen.getByText("Executive Impact Summary"));
    fireEvent.click(screen.getByText("Create Schedule"));

    await waitFor(() => {
      expect(screen.getByText("Report schedule created.")).toBeInTheDocument();
    });
  });

  it("shows error on API failure", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ detail: "Internal error" }),
    });

    render(<ReportBuilderPage />);
    fireEvent.click(screen.getByText("Executive Impact Summary"));
    fireEvent.click(screen.getByText("Generate Report"));

    await waitFor(() => {
      expect(screen.getByText("Internal error")).toBeInTheDocument();
    });
  });

  it("disables submit without template selected", () => {
    render(<ReportBuilderPage />);
    const btn = screen.getByText("Generate Report");
    expect(btn).toBeDisabled();
  });
});

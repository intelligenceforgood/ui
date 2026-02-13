import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FieldHelp, SectionHelp } from "@/components/help";

/**
 * Note: Radix Tooltip and Popover use portals with Popper positioning
 * which requires layout measurement unavailable in jsdom. These tests
 * verify rendering logic and graceful degradation. Full interaction
 * tests (hover → tooltip, click → popover) are covered in Playwright.
 */

describe("FieldHelp", () => {
  it("renders nothing for unknown key", () => {
    const { container } = render(<FieldHelp helpKey="nonexistent.key" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders a trigger button for a known key", () => {
    render(<FieldHelp helpKey="case.classification.riskScore" />);
    const button = screen.getByRole("button", { name: /help.*risk score/i });
    expect(button).toBeInTheDocument();
  });

  it("renders a trigger button for narrative help", () => {
    render(<FieldHelp helpKey="case.narrative" />);
    const button = screen.getByRole("button", {
      name: /help.*case narrative/i,
    });
    expect(button).toBeInTheDocument();
  });

  it("renders a trigger button for timeline help", () => {
    render(<FieldHelp helpKey="case.timeline" />);
    const button = screen.getByRole("button", { name: /help.*timeline/i });
    expect(button).toBeInTheDocument();
  });

  it("renders a trigger button for search query help", () => {
    render(<FieldHelp helpKey="search.query" />);
    const button = screen.getByRole("button", {
      name: /help.*search query syntax/i,
    });
    expect(button).toBeInTheDocument();
  });
});

describe("SectionHelp", () => {
  it("renders nothing for unknown key", () => {
    const { container } = render(<SectionHelp helpKey="nonexistent.key" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders a trigger button for a known key", () => {
    render(<SectionHelp helpKey="case.classification" />);
    const button = screen.getByRole("button", {
      name: /info.*classification/i,
    });
    expect(button).toBeInTheDocument();
  });

  it("renders a trigger button for search overview", () => {
    render(<SectionHelp helpKey="search.overview" />);
    const button = screen.getByRole("button", {
      name: /info.*intelligence search/i,
    });
    expect(button).toBeInTheDocument();
  });

  it("renders a trigger button for dossier overview", () => {
    render(<SectionHelp helpKey="dossier.overview" />);
    const button = screen.getByRole("button", {
      name: /info.*evidence dossiers/i,
    });
    expect(button).toBeInTheDocument();
  });
});

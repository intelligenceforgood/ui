import { describe, expect, it } from "vitest";
import {
  helpEntries,
  getHelpEntry,
  type HelpEntry,
} from "@/content/help/registry";
import { caseReviewHelp } from "@/content/help/case-review";
import { searchHelp } from "@/content/help/search";
import { classificationHelp } from "@/content/help/classification";
import { dossierHelp } from "@/content/help/dossier";

describe("Help content registry", () => {
  it("registers all case review entries", () => {
    for (const entry of caseReviewHelp) {
      expect(helpEntries[entry.key]).toBeDefined();
      expect(helpEntries[entry.key].title).toBe(entry.title);
    }
  });

  it("registers all search entries", () => {
    for (const entry of searchHelp) {
      expect(helpEntries[entry.key]).toBeDefined();
      expect(helpEntries[entry.key].title).toBe(entry.title);
    }
  });

  it("registers all classification entries", () => {
    for (const entry of classificationHelp) {
      expect(helpEntries[entry.key]).toBeDefined();
      expect(helpEntries[entry.key].title).toBe(entry.title);
    }
  });

  it("registers all dossier entries", () => {
    for (const entry of dossierHelp) {
      expect(helpEntries[entry.key]).toBeDefined();
      expect(helpEntries[entry.key].title).toBe(entry.title);
    }
  });

  it("getHelpEntry returns entry for known key", () => {
    const entry = getHelpEntry("case.classification.riskScore");
    expect(entry).toBeDefined();
    expect(entry!.title).toBe("Risk Score");
    expect(entry!.body).toContain("0–100");
  });

  it("getHelpEntry returns undefined for unknown key", () => {
    expect(getHelpEntry("nonexistent.key")).toBeUndefined();
  });

  it("all entries have required fields", () => {
    for (const [key, entry] of Object.entries(helpEntries)) {
      expect(entry.key).toBe(key);
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.body.length).toBeGreaterThan(0);
    }
  });

  it("all keys are unique", () => {
    const allEntries: HelpEntry[] = [
      ...caseReviewHelp,
      ...searchHelp,
      ...classificationHelp,
      ...dossierHelp,
    ];
    const keys = allEntries.map((e) => e.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it("has at least 30 help entries total", () => {
    const total = Object.keys(helpEntries).length;
    expect(total).toBeGreaterThanOrEqual(30);
  });

  it("case review has at least 10 entries", () => {
    expect(caseReviewHelp.length).toBeGreaterThanOrEqual(10);
  });

  it("search has at least 10 entries", () => {
    expect(searchHelp.length).toBeGreaterThanOrEqual(10);
  });

  it("classification has at least 5 entries covering all axes", () => {
    expect(classificationHelp.length).toBeGreaterThanOrEqual(5);
    const keys = classificationHelp.map((e) => e.key);
    expect(keys).toContain("classification.intent");
    expect(keys).toContain("classification.channel");
    expect(keys).toContain("classification.techniques");
    expect(keys).toContain("classification.actions");
    expect(keys).toContain("classification.persona");
  });

  it("dossier has entries for overview and generation", () => {
    const keys = dossierHelp.map((e) => e.key);
    expect(keys).toContain("dossier.overview");
    expect(keys).toContain("dossier.generation");
  });
});

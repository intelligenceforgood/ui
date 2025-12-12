import { render, screen } from "@testing-library/react";
import type { DossierRecord } from "@i4g/sdk";
import { describe, expect, it } from "vitest";

import { DossierList } from "@/app/(console)/reports/dossiers/dossier-list";

function buildRecord(): DossierRecord {
  return {
    planId: "plan-download-001",
    status: "completed",
    queuedAt: "2025-12-05T12:00:00.000Z",
    updatedAt: "2025-12-05T12:10:00.000Z",
    warnings: [],
    error: null,
    payload: {},
    manifestPath: null,
    manifest: null,
    signatureManifestPath: null,
    signatureManifest: null,
    artifactWarnings: [],
    downloads: {
      local: {
        manifest: "/data/reports/dossiers/plan-download-001.json",
        markdown: null,
        pdf: "/data/reports/dossiers/plan-download-001.pdf",
        html: null,
        signatureManifest: null,
      },
      remote: [
        {
          label: "Drive PDF",
          remoteRef: "https://drive.example.com/plan-download-001.pdf",
          hash: "abc123def456",
          algorithm: "sha256",
          sizeBytes: 2048,
        },
      ],
    },
  } satisfies DossierRecord;
}

describe("DossierList downloads", () => {
  it("renders local download links through the API proxy", () => {
    const record = buildRecord();

    render(
      <DossierList
        response={{ count: 1, items: [record] }}
        includeManifest={false}
      />,
    );

    const pdfLink = screen.getByRole("link", { name: /pdf/i });
    expect(pdfLink).toBeInTheDocument();
    expect(pdfLink.getAttribute("href")).toBe(
      "/api/dossiers/download?path=%2Fdata%2Freports%2Fdossiers%2Fplan-download-001.pdf",
    );
  });

  it("renders remote uploads with open links", () => {
    const record = buildRecord();

    render(
      <DossierList
        response={{ count: 1, items: [record] }}
        includeManifest={false}
      />,
    );

    expect(screen.getByText("Drive PDF")).toBeInTheDocument();
    const openLink = screen.getByRole("link", { name: /open/i });
    expect(openLink.getAttribute("href")).toBe(
      "https://drive.example.com/plan-download-001.pdf",
    );
    expect(screen.getByText(/SHA256/i)).toBeInTheDocument();
  });
});

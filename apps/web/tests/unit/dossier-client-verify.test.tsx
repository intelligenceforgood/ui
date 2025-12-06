import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { DossierRecord } from "@i4g/sdk";

import { DossierList } from "@/app/(console)/reports/dossiers/dossier-list";

global.fetch = vi.fn(async () =>
  new Response(new Uint8Array([1, 2, 3]).buffer, {
    status: 200,
  })
) as unknown as typeof fetch;

const mockDigest = vi.fn(async () => new Uint8Array([0, 0, 0]).buffer);

Object.defineProperty(global, "crypto", {
  value: {
    subtle: {
      digest: mockDigest,
    },
  },
});

function buildRecord(): DossierRecord {
  return {
    planId: "plan-verify-001",
    status: "completed",
    queuedAt: "2025-12-05T12:00:00.000Z",
    updatedAt: "2025-12-05T12:10:00.000Z",
    warnings: [],
    error: null,
    payload: {},
    manifestPath: null,
    manifest: null,
    signatureManifestPath: null,
    signatureManifest: {
      algorithm: "sha256",
      artifacts: [
        {
          label: "PDF",
          path: "/data/reports/dossiers/plan-verify-001.pdf",
          hash: "000000",
        },
      ],
    },
    artifactWarnings: [],
    downloads: {
      local: {
        manifest: null,
        markdown: null,
        pdf: "/data/reports/dossiers/plan-verify-001.pdf",
        html: null,
        signatureManifest: null,
      },
      remote: [],
    },
  } satisfies DossierRecord;
}

describe("Client-side dossier verification", () => {
  it("hashes artifacts via Web Crypto and reports results", async () => {
    const record = buildRecord();

    const user = userEvent.setup();
    render(<DossierList response={{ count: 1, items: [record] }} includeManifest={false} />);

    const button = screen.getByRole("button", { name: /verify client-side/i });
    await user.click(button);

    await waitFor(() => expect(mockDigest).toHaveBeenCalled());
    expect(screen.getByText(/Client-side hash check/i)).toBeInTheDocument();
    expect(screen.getByText(/Hash match/i)).toBeInTheDocument();
  });
});

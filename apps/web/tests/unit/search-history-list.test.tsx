import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchHistoryList } from "@/app/(console)/search/search-history-list";
import type { SearchHistoryEvent } from "@/types/reviews";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const baseEvent: SearchHistoryEvent = {
  id: "history-1",
  actor: "analyst_1",
  createdAt: "2025-12-02T00:00:00.000Z",
  params: {},
};

describe("SearchHistoryList", () => {
  it("renders filter summary and dataset badges when no query is present", () => {
    render(
      <SearchHistoryList
        events={[
          {
            ...baseEvent,
            params: {
              classifications: ["romance_scam"],
              datasets: ["intake"],
              entities: [{ type: "wallet", value: "0xabc", match_mode: "exact" }],
            },
          },
        ]}
      />
    );

    expect(screen.getByText("Taxonomy: romance_scam · Datasets: intake")).toBeInTheDocument();
    expect(screen.getByText("Dataset: intake")).toBeInTheDocument();
  });

  it("applies the summary as the rerun label when the query is empty", () => {
    render(
      <SearchHistoryList
        events={[
          {
            ...baseEvent,
            params: {
              classifications: ["romance_scam"],
              datasets: ["intake"],
            },
          },
        ]}
      />
    );

    const rerunLink = screen.getByRole("link", { name: /rerun search/i });
    const href = rerunLink.getAttribute("href");
    expect(href).toBeTruthy();
    const url = new URL(href ?? "", "https://example.com");
    expect(url.searchParams.get("savedSearchLabel")).toBe("Taxonomy: romance_scam · Datasets: intake");
  });

  it("replaces entries when new events arrive via props", async () => {
    const { rerender } = render(
      <SearchHistoryList
        events={[
          {
            ...baseEvent,
            id: "history-initial",
            query: "initial query",
          },
        ]}
      />
    );

    expect(screen.getByText("initial query")).toBeInTheDocument();

    rerender(
      <SearchHistoryList
        events={[
          {
            ...baseEvent,
            id: "history-next",
            query: "updated query",
          },
        ]}
      />
    );

    await waitFor(() => expect(screen.getByText("updated query")).toBeInTheDocument());
    expect(screen.queryByText("initial query")).not.toBeInTheDocument();
  });

  it("falls back to params.text when query is missing", () => {
    render(
      <SearchHistoryList
        events={[
          {
            ...baseEvent,
            id: "history-text-only",
            params: { text: "Fallback Text" },
          },
        ]}
      />
    );

    expect(screen.getByText("Fallback Text")).toBeInTheDocument();
  });

  it("prioritizes saved search names for titles and rerun labels", () => {
    render(
      <SearchHistoryList
        events={[
          {
            ...baseEvent,
            id: "history-saved",
            query: "",
            savedSearch: {
              id: "saved:abc",
              name: "High-risk wallets",
              owner: "analyst_1",
              tags: ["wallets"],
            },
          },
        ]}
      />
    );

    expect(screen.getByText("High-risk wallets")).toBeInTheDocument();
    expect(screen.getByText("Saved search")).toBeInTheDocument();
    const rerunLink = screen.getByRole("link", { name: /rerun search/i });
    const href = rerunLink.getAttribute("href");
    expect(href).toBeTruthy();
    const url = new URL(href ?? "", "https://example.com");
    expect(url.searchParams.get("savedSearchLabel")).toBe("High-risk wallets");
  });
});

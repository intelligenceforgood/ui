"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchRequest } from "@i4g/sdk";
import type {
  BuildSearchRequestOptions,
  EntityFilterRow,
  FacetSelection,
  SearchOverrides,
} from "./search-types";

export interface UseSavedSearchOptions {
  buildSearchRequestPayload: (
    overrides?: SearchOverrides,
    appliedSelection?: FacetSelection,
    appliedEntities?: EntityFilterRow[],
    options?: BuildSearchRequestOptions,
  ) => SearchRequest;
}

export function useSavedSearch({
  buildSearchRequestPayload,
}: UseSavedSearchOptions) {
  const router = useRouter();
  const [isSavingSearch, setIsSavingSearch] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveSearch = useCallback(() => {
    setSaveError(null);
    setSaveMessage(null);
    const requestPayload = buildSearchRequestPayload(
      undefined,
      undefined,
      undefined,
      { includeSavedSearchContext: false },
    );
    const trimmedQuery =
      typeof requestPayload.query === "string"
        ? requestPayload.query.trim()
        : "";
    const hasFilters =
      Boolean(trimmedQuery) ||
      Boolean(requestPayload.sources && requestPayload.sources.length) ||
      Boolean(requestPayload.taxonomy && requestPayload.taxonomy.length) ||
      Boolean(
        requestPayload.indicatorTypes && requestPayload.indicatorTypes.length,
      ) ||
      Boolean(requestPayload.datasets && requestPayload.datasets.length) ||
      Boolean(requestPayload.timePreset) ||
      Boolean(requestPayload.timeRange) ||
      Boolean(requestPayload.entities && requestPayload.entities.length);
    if (!hasFilters) {
      setSaveError("Provide a query or filters before saving.");
      return;
    }

    const suggestedName = trimmedQuery || "Untitled search";
    const name =
      typeof window !== "undefined"
        ? window.prompt("Name this search", suggestedName)
        : suggestedName;
    if (!name) {
      return;
    }

    setIsSavingSearch(true);
    void fetch("/api/reviews/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, params: requestPayload }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const details = await response.json().catch(() => ({}));
          const message =
            typeof details.error === "string"
              ? details.error
              : "Unable to save search";
          throw new Error(message);
        }
        setSaveMessage(`Saved "${name}"`);
        router.refresh();
        setTimeout(() => setSaveMessage(null), 6000);
      })
      .catch((saveErr: Error) => {
        setSaveError(saveErr.message || "Unable to save search");
      })
      .finally(() => {
        setIsSavingSearch(false);
      });
  }, [buildSearchRequestPayload, router]);

  return {
    isSavingSearch,
    saveMessage,
    saveError,
    handleSaveSearch,
  };
}

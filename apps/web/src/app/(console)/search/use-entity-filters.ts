"use client";

import { useCallback, useMemo } from "react";

import type {
  EntityFilterRow,
  FacetSelection,
  SearchOverrides,
} from "./search-types";
import { generateEntityFilterId } from "./search-types";

export interface UseEntityFiltersOptions {
  entityFilters: EntityFilterRow[];
  setEntityFilters: React.Dispatch<React.SetStateAction<EntityFilterRow[]>>;
  defaultIndicatorType: string;
  onClearSavedSearch: () => void;
  triggerSearch: (
    overrides?: SearchOverrides,
    appliedSelection?: FacetSelection,
    appliedEntities?: EntityFilterRow[],
    options?: { includeSavedSearchContext?: boolean },
  ) => void;
}

export function useEntityFilters({
  entityFilters,
  setEntityFilters,
  defaultIndicatorType,
  onClearSavedSearch,
  triggerSearch,
}: UseEntityFiltersOptions) {
  const addEntityFilter = useCallback(() => {
    onClearSavedSearch();
    setEntityFilters((current) => [
      ...current,
      {
        id: generateEntityFilterId(),
        type: defaultIndicatorType,
        value: "",
        matchMode: "exact",
      },
    ]);
  }, [defaultIndicatorType, onClearSavedSearch, setEntityFilters]);

  const updateEntityFilter = useCallback(
    (id: string, patch: Partial<EntityFilterRow>) => {
      onClearSavedSearch();
      setEntityFilters((current) =>
        current.map((entry) =>
          entry.id === id ? { ...entry, ...patch } : entry,
        ),
      );
    },
    [onClearSavedSearch, setEntityFilters],
  );

  const removeEntityFilter = useCallback(
    (id: string) => {
      onClearSavedSearch();
      setEntityFilters((current) => current.filter((entry) => entry.id !== id));
    },
    [onClearSavedSearch, setEntityFilters],
  );

  const resetEntityFilters = useCallback(() => {
    onClearSavedSearch();
    setEntityFilters([]);
    triggerSearch({ entities: [] }, undefined, [], {
      includeSavedSearchContext: false,
    });
  }, [onClearSavedSearch, setEntityFilters, triggerSearch]);

  const applyEntityFilters = useCallback(() => {
    triggerSearch({ entities: entityFilters }, undefined, entityFilters);
  }, [entityFilters, triggerSearch]);

  const activeEntityCount = useMemo(
    () =>
      entityFilters.filter((filter) => filter.value.trim().length > 0).length,
    [entityFilters],
  );

  return {
    addEntityFilter,
    updateEntityFilter,
    removeEntityFilter,
    resetEntityFilters,
    applyEntityFilters,
    activeEntityCount,
  };
}

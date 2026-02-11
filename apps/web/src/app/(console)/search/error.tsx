"use client";

import { ErrorFallback } from "@i4g/ui-kit";

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Search failed"
      description="Unable to load the search experience. Try adjusting your query or filters."
    />
  );
}

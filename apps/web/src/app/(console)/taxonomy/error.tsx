"use client";

import { ErrorFallback } from "@i4g/ui-kit";

export default function TaxonomyError({
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
      title="Taxonomy unavailable"
      description="Unable to load taxonomy definitions. The taxonomy service may be temporarily unreachable."
    />
  );
}

"use client";

import { ErrorFallback } from "@i4g/ui-kit";

/**
 * Root-level error boundary for page errors outside route groups like
 * `(console)`.  Catches errors in the SSI redirect page and any future
 * top-level routes.
 */
export default function RootError({
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
      title="Something went wrong"
      description="An unexpected error occurred. Please try again or navigate to the dashboard."
    />
  );
}

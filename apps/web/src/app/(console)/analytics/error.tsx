"use client";

import { ErrorFallback } from "@i4g/ui-kit";

export default function AnalyticsError({
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
      title="Analytics unavailable"
      description="Unable to load analytics data. The metrics service may be temporarily unreachable."
    />
  );
}

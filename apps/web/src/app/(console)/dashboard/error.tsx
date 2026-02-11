"use client";

import { ErrorFallback } from "@i4g/ui-kit";

export default function DashboardError({
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
      title="Dashboard unavailable"
      description="Unable to load the dashboard overview. The API may be temporarily unreachable."
    />
  );
}

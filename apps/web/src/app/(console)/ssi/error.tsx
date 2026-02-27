"use client";

import { ErrorFallback } from "@i4g/ui-kit";

export default function SsiError({
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
      title="Scam Investigator unavailable"
      description="An error occurred while loading the investigator. The SSI service may be temporarily unreachable."
    />
  );
}

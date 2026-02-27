"use client";

import { ErrorFallback } from "@i4g/ui-kit";

export default function InvestigationsError({
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
      title="Investigations unavailable"
      description="Unable to load investigation history. The SSI service may be temporarily unreachable."
    />
  );
}

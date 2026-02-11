"use client";

import { ErrorFallback } from "@i4g/ui-kit";

export default function CasesError({
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
      title="Cases unavailable"
      description="Unable to load the case pipeline. The cases service may be temporarily unreachable."
    />
  );
}

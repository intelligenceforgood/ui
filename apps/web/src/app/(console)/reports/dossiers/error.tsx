"use client";

import { ErrorFallback } from "@i4g/ui-kit";

export default function DossiersError({
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
      title="Evidence dossiers unavailable"
      description="Unable to load dossier data. The reports service may be temporarily unreachable."
    />
  );
}

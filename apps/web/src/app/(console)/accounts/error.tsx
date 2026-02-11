"use client";

import { ErrorFallback } from "@i4g/ui-kit";

export default function AccountsError({
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
      title="Account list unavailable"
      description="Unable to load account list data. The extraction service may be temporarily unreachable."
    />
  );
}

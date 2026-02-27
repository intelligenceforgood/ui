"use client";

import { ErrorFallback } from "@i4g/ui-kit";

export default function WalletsError({
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
      title="Wallet database unavailable"
      description="Unable to load the wallet database. The SSI service may be temporarily unreachable."
    />
  );
}

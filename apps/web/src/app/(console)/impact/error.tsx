"use client";

import { ErrorFallback } from "@i4g/ui-kit";

export default function ImpactError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} />;
}

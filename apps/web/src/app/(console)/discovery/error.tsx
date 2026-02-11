"use client";

import { ErrorFallback } from "@i4g/ui-kit";

export default function DiscoveryError({
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
      title="Discovery unavailable"
      description="Unable to load the Discovery panel. The Vertex AI Search service may be temporarily unreachable."
    />
  );
}

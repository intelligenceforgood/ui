"use client";

import { ErrorFallback } from "@i4g/ui-kit";

export default function CampaignsError({
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
      title="Campaigns unavailable"
      description="Unable to load campaign data. The campaigns service may be temporarily unreachable."
    />
  );
}

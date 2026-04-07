"use client";

import { useEngagement } from "@/lib/engagement-context";

export function CompletedEngagementBanner() {
  const { engagement } = useEngagement();

  if (!engagement || engagement.status !== "completed") return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <strong>This engagement has ended.</strong> Data is read-only. Review
      submissions are disabled.
    </div>
  );
}

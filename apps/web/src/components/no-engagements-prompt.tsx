"use client";

import { useEngagement } from "@/lib/engagement-context";
import { Card } from "@i4g/ui-kit";

export function NoEngagementsPrompt() {
  const { engagements, loading } = useEngagement();

  if (loading || engagements.length > 0) return null;

  return (
    <Card className="p-6 text-center">
      <p className="text-slate-600 dark:text-slate-400">
        No active engagements. Contact your manager to get assigned to an
        engagement.
      </p>
    </Card>
  );
}

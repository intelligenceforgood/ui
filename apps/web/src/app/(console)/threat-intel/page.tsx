import { getI4GClient } from "@/lib/i4g-client";
import { StatsCard } from "@i4g/ui-kit";
import { Shield, Globe } from "lucide-react";

export default async function ThreatIntelOverviewPage() {
  const client = await getI4GClient();
  const stats = await client.getPhishDestroyStats();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Total Threat Actors"
        value={stats.totalActors}
        icon={<Shield className="h-5 w-5" />}
      />
      <StatsCard
        title="Active Domains Investigated"
        value={stats.activeDomains}
        icon={<Globe className="h-5 w-5" />}
      />
    </div>
  );
}

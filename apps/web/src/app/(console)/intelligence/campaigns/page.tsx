import Link from "next/link";
import { Badge, Card, FeedbackButton } from "@i4g/ui-kit";
import { getI4GClient } from "@/lib/i4g-client";
import type { Metadata } from "next";
import type { ThreatCampaign } from "@i4g/sdk";
import { Shield, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Threat Campaigns",
  description: "View and manage threat campaigns across the platform.",
};

export const dynamic = "force-dynamic";

const statusVariant: Record<string, "default" | "success" | "danger"> = {
  active: "danger",
  monitoring: "default",
  resolved: "success",
};

export default async function ThreatCampaignsPage() {
  const client = await getI4GClient();
  const { items: campaigns, count } = await client.listThreatCampaigns({
    limit: 50,
  });

  return (
    <div className="group relative space-y-6">
      <FeedbackButton
        feedbackId="intelligence.campaigns"
        className="absolute top-1 right-0 z-10"
      />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Intelligence
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Threat Campaigns
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {count} campaign{count !== 1 ? "s" : ""} tracked
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign: ThreatCampaign) => (
          <Link
            key={campaign.id}
            href={`/intelligence/campaigns/${campaign.id}`}
          >
            <Card className="space-y-3 p-4 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <h3 className="font-semibold text-slate-900">
                    {campaign.name}
                  </h3>
                </div>
                <Badge variant={statusVariant[campaign.status] ?? "default"}>
                  {campaign.status}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-slate-400">Cases</span>
                  <p className="font-medium text-slate-700">
                    {campaign.caseCount}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Indicators</span>
                  <p className="font-medium text-slate-700">
                    {campaign.indicatorCount}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Loss</span>
                  <p className="font-medium text-slate-700">
                    ${campaign.lossSum.toLocaleString()}
                  </p>
                </div>
              </div>
              {campaign.riskScore > 7 && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  High risk (score: {campaign.riskScore})
                </div>
              )}
            </Card>
          </Link>
        ))}
        {campaigns.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-slate-200 py-12 text-center">
            <p className="text-slate-500">No threat campaigns detected yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

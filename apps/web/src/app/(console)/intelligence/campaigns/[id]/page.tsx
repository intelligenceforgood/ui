import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { Badge, Card, FeedbackButton } from "@i4g/ui-kit";
import { getI4GClient } from "@/lib/i4g-client";
import { Shield, Calendar, DollarSign, Users } from "lucide-react";

const CampaignTimeline = nextDynamic(() => import("./campaign-timeline"), {
  loading: () => (
    <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
  ),
});

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  return { title: `Campaign ${(await params).id}` };
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = getI4GClient();
  const [campaign, timeline, graph] = await Promise.all([
    client.getThreatCampaign(id),
    client.getCampaignTimeline(id),
    client.getCampaignGraph(id),
  ]);

  const statusVariant: Record<string, "default" | "success" | "danger"> = {
    active: "danger",
    monitoring: "default",
    resolved: "success",
  };

  return (
    <div className="group relative space-y-6">
      <FeedbackButton
        feedbackId="intelligence.campaign-detail"
        className="absolute top-1 right-0 z-10"
      />

      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-slate-400" />
          <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
          <Badge variant={statusVariant[campaign.status] ?? "default"}>
            {campaign.status}
          </Badge>
        </div>
        <p className="text-sm text-slate-500">Campaign ID: {campaign.id}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="flex items-center gap-3 p-4">
          <Users className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-sm text-slate-500">Cases</p>
            <p className="text-xl font-semibold">{campaign.caseCount}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <Shield className="h-5 w-5 text-purple-500" />
          <div>
            <p className="text-sm text-slate-500">Indicators</p>
            <p className="text-xl font-semibold">{campaign.indicatorCount}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <DollarSign className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-sm text-slate-500">Total Loss</p>
            <p className="text-xl font-semibold">
              ${campaign.lossSum.toLocaleString()}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <Calendar className="h-5 w-5 text-emerald-500" />
          <div>
            <p className="text-sm text-slate-500">Active Since</p>
            <p className="text-xl font-semibold">
              {campaign.firstCaseAt
                ? new Date(campaign.firstCaseAt).toLocaleDateString()
                : "—"}
            </p>
          </div>
        </Card>
      </section>

      <CampaignTimeline
        timeline={timeline}
        graph={graph}
        entityTypes={campaign.entityTypes ?? []}
      />
    </div>
  );
}

import Link from "next/link";
import { Plus } from "lucide-react";
import { listCampaigns } from "@/lib/server/campaigns-service";
import { Card } from "@i4g/ui-kit";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campaigns",
};

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await listCampaigns();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight dark:text-white">
          Campaigns
        </h1>
        <Link
          href="/campaigns/new"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                {campaign.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                {campaign.description}
              </p>
            </div>
            {campaign.taxonomy_rollup &&
              campaign.taxonomy_rollup.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Governance
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {campaign.taxonomy_rollup.map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      >
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </Card>
        ))}
        {campaigns.length === 0 && (
          <div className="col-span-full py-12 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400">
              No campaigns found. Create one to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import { CampaignForm } from "@/components/campaign-form";
import { getTaxonomyTree } from "@/lib/server/taxonomy-service";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Campaign",
};

export default async function NewCampaignPage() {
  const taxonomy = await getTaxonomyTree();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight dark:text-white">
          Create Campaign
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Define a new tactical campaign and link it to strategic governance.
        </p>
      </div>
      <CampaignForm taxonomy={taxonomy} />
    </div>
  );
}

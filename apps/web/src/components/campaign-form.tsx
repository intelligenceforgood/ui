"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea } from "@i4g/ui-kit";
import { createCampaign } from "@/lib/server/campaigns-service";
import type { TaxonomyResponse } from "@i4g/sdk";

export function CampaignForm({
  taxonomy: _taxonomy,
}: {
  taxonomy: TaxonomyResponse;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTaxonomyIds, setSelectedTaxonomyIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createCampaign({
        name,
        description,
        taxonomy_labels: {}, // Default empty for now
        associated_taxonomy_ids: selectedTaxonomyIds,
      });
      router.push("/campaigns");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  // TODO: re-enable when taxonomy selector UI is updated for 5-axis taxonomy
  void _taxonomy;
  void setSelectedTaxonomyIds;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <label className="block text-sm font-medium dark:text-slate-200">
          Name
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium dark:text-slate-200">
          Description
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium dark:text-slate-200">
            Governance Assignment (Strategic)
          </label>
          <div className="relative group cursor-help">
            <span className="text-xs text-blue-500 underline decoration-dotted">
              Why do I need to pick this?
            </span>
            <div className="absolute bottom-full right-0 mb-2 hidden w-64 rounded bg-slate-800 p-3 text-xs text-white shadow-lg group-hover:block z-10">
              This selection links your tactical work to organizational risk
              categories (e.g., Scam Intent, Delivery Channel). It drives
              executive reporting and ensures your campaign is counted in the
              correct strategic buckets.
            </div>
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm text-yellow-600">
            Campaign Taxonomy selection is temporarily disabled pending UI
            update for 5-axis taxonomy.
          </p>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Create Campaign"}
      </Button>
    </form>
  );
}

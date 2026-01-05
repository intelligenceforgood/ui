import type { Metadata } from "next";
import { Badge, Card } from "@i4g/ui-kit";
import {
  ScamIntent,
  DeliveryChannel,
  SocialEngineeringTechnique,
  RequestedAction,
  ClaimedPersona,
} from "@i4g/types";

export const metadata: Metadata = {
  title: "Taxonomy",
  description: "Manage shared vocabularies and case tagging standards.",
};

function TaxonomySection({
  title,
  items,
}: {
  title: string;
  items: Record<string, string>;
}) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <Badge variant="default">{Object.keys(items).length} items</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(items).map(([key, value]) => (
          <div
            key={key}
            className="rounded-lg border border-slate-100 bg-slate-50 p-3"
          >
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              {key}
            </div>
            <div className="font-mono text-sm text-slate-700 break-all">
              {value}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function TaxonomyPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Controlled vocabulary
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Fraud Taxonomy Definitions
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Single Source of Truth (SSOT) for fraud classification. These
            definitions are auto-generated from the core schema.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        <TaxonomySection title="Scam Intents" items={ScamIntent} />
        <TaxonomySection title="Delivery Channels" items={DeliveryChannel} />
        <TaxonomySection
          title="Social Engineering Techniques"
          items={SocialEngineeringTechnique}
        />
        <TaxonomySection title="Requested Actions" items={RequestedAction} />
        <TaxonomySection title="Claimed Personas" items={ClaimedPersona} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Badge, Card } from "@i4g/ui-kit";
import {
  ScamIntent,
  ScamIntentDescriptions,
  ScamIntentLabels,
  ScamIntentExamples,
  DeliveryChannel,
  DeliveryChannelDescriptions,
  DeliveryChannelLabels,
  DeliveryChannelExamples,
  SocialEngineeringTechnique,
  SocialEngineeringTechniqueDescriptions,
  SocialEngineeringTechniqueLabels,
  SocialEngineeringTechniqueExamples,
  RequestedAction,
  RequestedActionDescriptions,
  RequestedActionLabels,
  RequestedActionExamples,
  ClaimedPersona,
  ClaimedPersonaDescriptions,
  ClaimedPersonaLabels,
  ClaimedPersonaExamples,
} from "@i4g/types";

export const metadata: Metadata = {
  title: "Taxonomy",
  description: "Manage shared vocabularies and case tagging standards.",
};

function TaxonomySection<T extends string>({
  title,
  enumObj,
  labels,
  descriptions,
  examples,
}: {
  title: string;
  enumObj: Record<string, T>;
  labels: Record<T, string>;
  descriptions: Record<T, string>;
  examples: Record<T, string[]>;
}) {
  const codes = Object.values(enumObj) as T[];

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <Badge variant="default">{codes.length} items</Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {codes.map((code) => (
          <div
            key={code}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col h-full"
          >
            <div className="flex justify-between items-start mb-2 gap-2">
              <h3 className="font-semibold text-slate-900">{labels[code]}</h3>
              <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 shrink-0">
                {code}
              </code>
            </div>

            <p className="text-sm text-slate-600 mb-4 grow">
              {descriptions[code]}
            </p>

            {examples[code] && examples[code].length > 0 && (
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Examples
                </p>
                <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                  {examples[code].map((ex, i) => (
                    <li key={i} className="pl-1">
                      <span className="-ml-1">{ex}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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

      <div className="space-y-8">
        <TaxonomySection
          title="Scam Intents"
          enumObj={ScamIntent}
          labels={ScamIntentLabels}
          descriptions={ScamIntentDescriptions}
          examples={ScamIntentExamples}
        />
        <TaxonomySection
          title="Delivery Channels"
          enumObj={DeliveryChannel}
          labels={DeliveryChannelLabels}
          descriptions={DeliveryChannelDescriptions}
          examples={DeliveryChannelExamples}
        />
        <TaxonomySection
          title="Social Engineering Techniques"
          enumObj={SocialEngineeringTechnique}
          labels={SocialEngineeringTechniqueLabels}
          descriptions={SocialEngineeringTechniqueDescriptions}
          examples={SocialEngineeringTechniqueExamples}
        />
        <TaxonomySection
          title="Requested Actions"
          enumObj={RequestedAction}
          labels={RequestedActionLabels}
          descriptions={RequestedActionDescriptions}
          examples={RequestedActionExamples}
        />
        <TaxonomySection
          title="Claimed Personas"
          enumObj={ClaimedPersona}
          labels={ClaimedPersonaLabels}
          descriptions={ClaimedPersonaDescriptions}
          examples={ClaimedPersonaExamples}
        />
      </div>
    </div>
  );
}

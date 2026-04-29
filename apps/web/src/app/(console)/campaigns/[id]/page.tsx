import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Layers,
  ShieldAlert,
  DollarSign,
  Server,
  Users,
} from "lucide-react";
import { Badge, Card, FeedbackButton } from "@i4g/ui-kit";
import { apiFetch } from "@/lib/server/api-client";

export const metadata: Metadata = {
  title: "Campaign Detail",
};

export const dynamic = "force-dynamic";

interface LinkedCase {
  case_id: string;
  dataset: string;
  classification: string | null;
  status: string;
  risk_score: number;
  created_at: string | null;
}

interface CampaignDetail {
  id: string;
  name: string;
  description: string | null;
  taxonomy_labels: Record<string, unknown> | null;
  taxonomy_rollup: string[];
  status: string;
  created_at: string | null;
  linked_cases: LinkedCase[];
  damage_ledger?: {
    currency: string;
    claimed: number;
    confirmed: number;
  }[];
  infrastructure_profile?: {
    tech_stack: string[];
    subdomain_roles: Record<string, string>;
    source_maps_exposed: boolean;
    auth_model: string;
  };
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let campaign: CampaignDetail;
  try {
    campaign = await apiFetch<CampaignDetail>(`/campaigns/${id}`);
  } catch {
    return (
      <div className="space-y-4">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Campaigns
        </Link>
        <p className="text-sm text-red-600">Campaign not found.</p>
      </div>
    );
  }

  const taxonomyLabels = campaign.taxonomy_labels
    ? Object.entries(campaign.taxonomy_labels).flatMap(([, v]) =>
        Array.isArray(v) ? v : [v],
      )
    : [];

  return (
    <div className="group relative space-y-6">
      <FeedbackButton
        feedbackId="campaigns.detail"
        className="absolute top-1 right-0 z-10"
      />
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Campaigns
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          {campaign.description && (
            <p className="text-sm text-slate-500">{campaign.description}</p>
          )}
        </div>
        <Badge variant={campaign.status === "active" ? "success" : "warning"}>
          {campaign.status}
        </Badge>
      </div>

      {/* Taxonomy tags */}
      {taxonomyLabels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {taxonomyLabels.map((label) => (
            <Badge key={String(label)} variant="info">
              {String(label)}
            </Badge>
          ))}
        </div>
      )}

      {/* Campaign info */}
      <Card className="p-4">
        <div className="flex items-center gap-6 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <Layers className="h-4 w-4" />
            <span>{campaign.linked_cases.length} linked cases</span>
          </div>
          {campaign.created_at && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                Created {new Date(campaign.created_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Damage Ledger */}
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <DollarSign className="h-5 w-5 text-slate-500" />
            Damage Ledger
          </h2>
          {campaign.damage_ledger && campaign.damage_ledger.length > 0 ? (
            <div className="space-y-2">
              {campaign.damage_ledger.map((ledger, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{ledger.currency}</span>
                    <div className="flex gap-4 text-sm">
                      <div className="flex flex-col items-end">
                        <span className="text-slate-500">Claimed</span>
                        <span>{ledger.claimed.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-slate-500">Confirmed</span>
                        <span className="font-medium text-emerald-600">
                          {ledger.confirmed.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-4 text-center text-sm text-slate-400 border-dashed">
              No damage data available.
            </Card>
          )}
        </div>

        {/* Infrastructure Profile */}
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Server className="h-5 w-5 text-slate-500" />
            Infrastructure Profile
          </h2>
          {campaign.infrastructure_profile ? (
            <Card className="p-4 space-y-4">
              <div>
                <span className="text-sm font-medium text-slate-500">
                  Tech Stack
                </span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {campaign.infrastructure_profile.tech_stack.map((tech) => (
                    <Badge key={tech} variant="default">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-slate-500">
                    Auth Model
                  </span>
                  <p className="mt-1 text-sm">
                    {campaign.infrastructure_profile.auth_model}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-500">
                    Source Maps
                  </span>
                  <p className="mt-1 text-sm">
                    {campaign.infrastructure_profile.source_maps_exposed ? (
                      <span className="text-red-600 font-medium">Exposed</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">
                        Secure
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {Object.keys(campaign.infrastructure_profile.subdomain_roles)
                .length > 0 && (
                <div>
                  <span className="text-sm font-medium text-slate-500">
                    Subdomain Roles
                  </span>
                  <div className="mt-1 space-y-1">
                    {Object.entries(
                      campaign.infrastructure_profile.subdomain_roles,
                    ).map(([sub, role]) => (
                      <div key={sub} className="flex justify-between text-sm">
                        <span className="font-mono text-slate-600">{sub}</span>
                        <span>{role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-4 text-center text-sm text-slate-400 border-dashed">
              No infrastructure profile available.
            </Card>
          )}
        </div>
      </div>

      {/* Actors Placeholder */}
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5 text-slate-500" />
          Actors
        </h2>
        <Card className="p-8 text-center border-dashed">
          <Users className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-600">Actors Tracking</p>
          <p className="text-xs text-slate-500 mt-1">
            To be fully hydrated in Sprint 3.
          </p>
        </Card>
      </div>

      {/* Linked cases timeline */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Linked Cases</h2>

        {campaign.linked_cases.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            No cases linked to this campaign yet.
          </p>
        ) : (
          <div className="space-y-2">
            {campaign.linked_cases
              .sort(
                (a, b) =>
                  new Date(b.created_at ?? 0).getTime() -
                  new Date(a.created_at ?? 0).getTime(),
              )
              .map((c) => (
                <Card
                  key={c.case_id}
                  className="p-4 transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Link
                        href={`/cases/${c.case_id}`}
                        className="font-mono text-sm font-medium text-blue-600 hover:underline"
                      >
                        {c.case_id.slice(0, 8)}...
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{c.dataset}</span>
                        {c.classification && (
                          <Badge variant="info">{c.classification}</Badge>
                        )}
                        {c.created_at && (
                          <span>
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {c.risk_score > 0 && (
                        <div className="flex items-center gap-1">
                          <ShieldAlert
                            className={`h-4 w-4 ${
                              c.risk_score >= 7
                                ? "text-red-500"
                                : c.risk_score >= 4
                                  ? "text-amber-500"
                                  : "text-emerald-500"
                            }`}
                          />
                          <span className="text-xs font-medium">
                            {c.risk_score.toFixed(1)}
                          </span>
                        </div>
                      )}
                      <Badge
                        variant={c.status === "open" ? "default" : "warning"}
                      >
                        {c.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { Badge, Button, Card } from "@i4g/ui-kit";
import { getI4GClient } from "@/lib/i4g-client";
import type { TaxonomyNode } from "@i4g/sdk";
import { Layers3, PlusCircle, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Taxonomy",
  description: "Manage shared vocabularies and case tagging standards.",
};

function TaxonomyTree({
  nodes,
  depth = 0,
}: {
  nodes: TaxonomyNode[];
  depth?: number;
}) {
  return (
    <ul className="space-y-3">
      {nodes.map((node) => (
        <li
          key={node.id}
          className="rounded-xl border border-slate-100 bg-white/70 p-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <span>Level {depth + 1}</span>
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                {node.label}
              </h3>
              <p className="text-xs text-slate-500">{node.description}</p>
            </div>
            <Badge variant="info">{node.count} tagged items</Badge>
          </div>
          {node.children.length ? (
            <div className="mt-4 border-t border-slate-100 pt-4 pl-3">
              <TaxonomyTree nodes={node.children} depth={depth + 1} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default async function TaxonomyPage() {
  const client = getI4GClient();
  const taxonomy = await client.getTaxonomy();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Controlled vocabulary
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Govern shared taxonomy across teams
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Ensure consistent tagging for analytics, case attribution, and
            compliance controls across Intelligence for Good.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" className="shadow-lg">
            <PlusCircle className="h-4 w-4" />
            Add taxonomy node
          </Button>
          <Button type="button" variant="secondary">
            <ShieldCheck className="h-4 w-4" />
            Propose change
          </Button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Taxonomy tree
            </h2>
            <Badge variant="default">Stewarded by {taxonomy.steward}</Badge>
          </div>
          <p className="text-xs text-slate-500">
            Last updated {new Date(taxonomy.updatedAt).toLocaleString()}
          </p>
          <TaxonomyTree nodes={taxonomy.nodes} />
        </Card>
        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <Layers3 className="h-10 w-10 rounded-2xl bg-teal-50 p-2 text-teal-600" />
            <div>
              <p className="text-sm text-slate-500">Coverage</p>
              <p className="text-2xl font-semibold text-slate-900">
                {taxonomy.nodes.reduce((acc, node) => acc + node.count, 0)}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Counts reflect current tagged items across investigations, ingestion
            pipelines, and partner escalations.
          </p>
        </Card>
      </section>
    </div>
  );
}

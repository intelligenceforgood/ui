import type { Metadata } from "next";
import { Badge, Card } from "@i4g/ui-kit";
import { getTaxonomyTree } from "@/lib/server/taxonomy-service";
import { ListTree } from "lucide-react";

export const metadata: Metadata = {
  title: "Taxonomy",
  description: "Manage shared vocabularies and case tagging standards.",
};

// Updated Types matching the new 5-axis API response structure
interface TaxonomyItem {
  code: string;
  label: string;
  description: string;
  examples?: string[];
}

interface TaxonomyAxis {
  id: string;
  label: string;
  description: string;
  items: TaxonomyItem[];
}

interface TaxonomyDefinitions {
  version: string;
  steward: string;
  updatedAt: string;
  axes: TaxonomyAxis[];
}

function TaxonomySection({ axis }: { axis: TaxonomyAxis }) {
  const items = axis.items || [];

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-50 rounded-md text-teal-700">
            <ListTree className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {axis.label}
            </h2>
            <p className="text-sm text-slate-500">{axis.description}</p>
          </div>
        </div>

        <Badge variant="default">{items.length} definitions</Badge>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.code}
              className="group rounded-lg border border-slate-200 bg-slate-50/50 p-4 shadow-sm hover:bg-white hover:border-teal-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-2 gap-2">
                <h3 className="font-semibold text-slate-900">{item.label}</h3>
                <code className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono tracking-tight shrink-0">
                  {item.code}
                </code>
              </div>

              <p className="text-sm text-slate-600 mb-3">{item.description}</p>

              {item.examples && item.examples.length > 0 && (
                <div className="pt-3 border-t border-slate-200/60 flex flex-col gap-1.5">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Examples
                  </p>
                  <ul className="text-xs text-slate-500 list-disc list-inside space-y-1">
                    {item.examples.slice(0, 2).map((ex, idx) => (
                      <li key={idx}>&quot;{ex}&quot;</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-slate-400 italic">
          No definitions found for this axis.
        </div>
      )}
    </Card>
  );
}

export default async function TaxonomyPage() {
  // Cast the response to our new type
  const taxonomy = (await getTaxonomyTree()) as unknown as TaxonomyDefinitions;

  // Format the update date if valid, otherwise fallback
  let formattedDate = "Unknown";
  try {
    if (taxonomy.updatedAt) {
      formattedDate = new Intl.DateTimeFormat("en", {
        dateStyle: "long",
      }).format(new Date(taxonomy.updatedAt));
    }
  } catch {
    // ignore invalid dates
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Controlled vocabulary
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Fraud Taxonomy Definitions
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Five-axis classification system for standardized case tagging.
                Changes here propagate to the Analyst Console and partner API.
              </p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>
                Version:{" "}
                <span className="font-medium text-slate-600">
                  {taxonomy.version || "1.0"}
                </span>
              </p>
              <p>
                Steward:{" "}
                <span className="font-medium text-slate-600">
                  {taxonomy.steward || "Unknown"}
                </span>
              </p>
              <p>
                Last updated:{" "}
                <span className="font-medium text-slate-600">
                  {formattedDate}
                </span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {taxonomy.axes && taxonomy.axes.length > 0 ? (
          taxonomy.axes.map((axis) => (
            <TaxonomySection key={axis.id} axis={axis} />
          ))
        ) : (
          <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-slate-500">
              No taxonomy axes definitions found.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Check the API connection or data source.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

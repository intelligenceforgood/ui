import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { Badge, Card } from "@i4g/ui-kit";
import { getI4GClient } from "@/lib/i4g-client";
import SearchExperience from "./search-experience";

export const metadata: Metadata = {
  title: "Search",
  description: "Cross-intelligence search across filings, chatter, and partner data.",
};

export default async function SearchPage() {
  const client = getI4GClient();
  const initialResults = await client.searchIntelligence({ query: "", page: 1, pageSize: 10 });

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Intelligence search
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">Search signals, cases, and chatter</h1>
        <p className="max-w-3xl text-sm text-slate-500">
          Query across structured and unstructured datasets. Filters instantly narrow results by source, taxonomy, or time.
        </p>
      </header>

      <Card className="flex flex-col gap-3 border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Sparkles className="h-4 w-4 text-teal-500" />
          <span>
            {initialResults.stats.total} intelligence hits indexed · {initialResults.suggestions.length} auto-suggestions ready
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {initialResults.facets.slice(0, 3).map((facet) => (
            <Badge key={facet.field} variant="info">
              {facet.label}: {facet.options.length} options
            </Badge>
          ))}
        </div>
      </Card>

      <SearchExperience initialResults={initialResults} />
    </div>
  );
}

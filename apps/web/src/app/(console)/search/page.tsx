import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { Badge, Card } from "@i4g/ui-kit";
import { getI4GClient } from "@/lib/i4g-client";
import SearchExperience from "./search-experience";
import { getHybridSearchSchema, getSearchHistory, listSavedSearches } from "@/lib/server/reviews-service";
import { SearchHistoryList } from "./search-history-list";
import { SavedSearchesList } from "./saved-searches-list";

export const metadata: Metadata = {
  title: "Search",
  description: "Cross-intelligence search across filings, chatter, and partner data.",
};

type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function toArrayParam(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => entry.split(","))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  if (typeof value === "string" && value.length > 0) {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const client = getI4GClient();
  const resolvedSearchParams = (await searchParams) ?? {};
  const initialQuery = typeof resolvedSearchParams.query === "string" ? resolvedSearchParams.query : "";
  const initialSources = toArrayParam(resolvedSearchParams.sources);
  const initialTaxonomy = toArrayParam(resolvedSearchParams.taxonomy);

  const initialResults = await client.searchIntelligence({
    query: initialQuery,
    page: 1,
    pageSize: 10,
    sources: initialSources.length ? initialSources : undefined,
    taxonomy: initialTaxonomy.length ? initialTaxonomy : undefined,
  });

  const [schema, history, savedSearches] = await Promise.all([
    getHybridSearchSchema(),
    getSearchHistory(6),
    listSavedSearches({ limit: 6 }),
  ]);

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

      <SearchExperience
        initialResults={initialResults}
        initialSelection={{ sources: initialSources, taxonomy: initialTaxonomy }}
        schema={schema}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <SearchHistoryList events={history} />
        <SavedSearchesList items={savedSearches} />
      </section>
    </div>
  );
}

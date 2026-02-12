"use client";

import { memo } from "react";
import { Badge, Card } from "@i4g/ui-kit";
import type { SearchResult, TaxonomyResponse } from "@i4g/sdk";
import { TextWithTokens } from "@/components/text-with-tokens";
import { ClassificationBadges } from "@/components/classification-badges";
import { ArrowUpRight } from "lucide-react";

import { sourceColors } from "./search-types";

export type SearchResultCardProps = {
  result: SearchResult;
  index: number;
  taxonomy: TaxonomyResponse;
  isExpanded: boolean;
  onToggleDetails: (id: string) => void;
};

export const SearchResultCard = memo(function SearchResultCard({
  result,
  index,
  taxonomy,
  isExpanded,
  onToggleDetails,
}: SearchResultCardProps) {
  const pillClasses =
    sourceColors[result.source] ?? "text-slate-600 bg-slate-100";
  const occurred = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(result.occurredAt));

  return (
    <li key={`${result.id ?? "result"}-${index}`}>
      <Card className="group flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <span className={`rounded-full px-3 py-1 ${pillClasses}`}>
                {result.source}
              </span>
              <span suppressHydrationWarning>{occurred}</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">
              <TextWithTokens text={result.title} />
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              <TextWithTokens text={result.snippet} />
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <Badge variant="default">
              Score {Math.round(result.score * 100)}%
            </Badge>
            {typeof result.confidence === "number" ? (
              <Badge variant="success">
                Confidence {Math.round(result.confidence * 100)}%
              </Badge>
            ) : null}
            <button
              type="button"
              className="inline-flex items-center gap-2 text-xs font-semibold text-teal-600 transition hover:text-teal-700"
              aria-expanded={isExpanded}
              onClick={() => onToggleDetails(result.id)}
            >
              {isExpanded ? "Hide details" : "Open details"}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Classification badges */}
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <ClassificationBadges
            classification={result.classification}
            taxonomy={taxonomy}
            tags={result.tags}
            keyPrefix={`${result.id}-`}
          />
        </div>

        {/* Expanded details */}
        {isExpanded ? (
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
            <p>
              <TextWithTokens text={result.snippet} />
            </p>

            {result.classification?.explanation ? (
              <div className="mt-4 rounded-md bg-white p-3 shadow-sm ring-1 ring-slate-900/5">
                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Classification Analysis
                </h4>
                <p className="text-slate-700">
                  {result.classification.explanation}
                </p>
              </div>
            ) : null}

            {result.classification?.few_shot_examples &&
            result.classification.few_shot_examples.length > 0 ? (
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Reference Examples
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {result.classification.few_shot_examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="rounded border border-slate-200 bg-white p-2 text-xs"
                    >
                      <pre className="whitespace-pre-wrap break-all font-mono text-[10px] text-slate-500">
                        {JSON.stringify(ex, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <dl className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
              <div className="flex flex-col">
                <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Occurred
                </dt>
                <dd>{new Date(result.occurredAt).toLocaleString()}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Source
                </dt>
                <dd className="capitalize">{result.source}</dd>
              </div>
              {typeof result.confidence === "number" ? (
                <div className="flex flex-col">
                  <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Confidence
                  </dt>
                  <dd>{Math.round(result.confidence * 100)}%</dd>
                </div>
              ) : null}
              <div className="flex flex-col">
                <dt className="font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Score
                </dt>
                <dd>{Math.round(result.score * 100)}%</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </Card>
    </li>
  );
});

SearchResultCard.displayName = "SearchResultCard";

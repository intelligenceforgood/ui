"use client";

import { memo } from "react";
import { Badge, Card } from "@i4g/ui-kit";

import type { DiscoveryResult } from "./discovery-types";
import {
  formatDocumentId,
  formatDocumentName,
  formatJsonForDisplay,
} from "./discovery-types";
import { TextWithTokens } from "@/components/text-with-tokens";
import { PreWithTokens } from "@/components/pre-with-tokens";

export type DiscoveryResultCardProps = {
  result: DiscoveryResult;
  showRaw: boolean;
};

export const DiscoveryResultCard = memo(function DiscoveryResultCard({
  result,
  showRaw,
}: DiscoveryResultCardProps) {
  const friendlyDocumentName = formatDocumentName(result.documentName);
  const hasSummary = Boolean(result.summary && result.summary.trim());
  const displayTitle = hasSummary ? result.summary! : friendlyDocumentName;
  const formattedStruct = formatJsonForDisplay(result.struct);
  const formattedRawPayload = formatJsonForDisplay(result.raw);

  return (
    <Card key={`${result.rank}-${result.documentId}`} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
              #{result.rank}
            </span>
            {result.source ? (
              <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-600">
                {result.source}
              </span>
            ) : null}
            {result.indexType && result.indexType !== result.source ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">
                {result.indexType}
              </span>
            ) : null}
          </div>
          <h3
            className="mt-2 text-lg font-semibold text-slate-900"
            title={result.documentName ?? undefined}
          >
            <TextWithTokens text={displayTitle} />
          </h3>
          <p
            className="text-sm text-slate-500"
            title={result.documentName ?? undefined}
          >
            Case: <TextWithTokens text={friendlyDocumentName} />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {result.label ? (
            <Badge variant="info">Label: {result.label}</Badge>
          ) : null}
          <Badge variant="default">
            ID {formatDocumentId(result.documentId)}
          </Badge>
        </div>
      </div>
      {hasSummary ? (
        <p className="text-sm text-slate-600">
          <TextWithTokens text={result.summary!} />
        </p>
      ) : null}
      {result.tags.length ? (
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {result.tags.map((tag) => (
            <Badge key={`${result.documentId}-${tag}`} variant="default">
              #<TextWithTokens text={tag} />
            </Badge>
          ))}
        </div>
      ) : null}
      {Object.keys(result.rankSignals).length ? (
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-500">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Rank signals
          </p>
          <dl className="mt-2 grid gap-2 sm:grid-cols-2">
            {Object.entries(result.rankSignals)
              .slice(0, 6)
              .map(([key, value]) => (
                <div key={key}>
                  <dt className="font-semibold text-slate-600">{key}</dt>
                  <dd className="text-slate-500">
                    {typeof value === "number"
                      ? value.toFixed(4)
                      : String(value)}
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      ) : null}
      {Object.keys(result.struct).length ? (
        <details className="rounded-xl border border-slate-100 bg-white/60 p-4 text-xs text-slate-500">
          <summary className="cursor-pointer font-semibold text-slate-600">
            Structured fields
          </summary>
          <pre className="mt-3 whitespace-pre-wrap break-all text-[11px] text-slate-500">
            <PreWithTokens text={formattedStruct} />
          </pre>
        </details>
      ) : null}
      {showRaw ? (
        <details className="rounded-xl border border-slate-100 bg-white/40 p-4 text-xs text-slate-500">
          <summary className="cursor-pointer font-semibold text-slate-600">
            Raw payload
          </summary>
          <pre className="mt-3 whitespace-pre-wrap break-all text-[11px] text-slate-500">
            <PreWithTokens text={formattedRawPayload} />
          </pre>
        </details>
      ) : null}
    </Card>
  );
});

DiscoveryResultCard.displayName = "DiscoveryResultCard";

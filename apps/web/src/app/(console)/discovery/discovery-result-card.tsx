"use client";

import { memo } from "react";
import { Badge, Card } from "@i4g/ui-kit";

import type { DiscoveryResult } from "./discovery-types";
import {
  formatDocumentId,
  formatDocumentName,
  redactJsonForDisplay,
  redactSensitiveText,
} from "./discovery-types";

export type DiscoveryResultCardProps = {
  result: DiscoveryResult;
  showRaw: boolean;
};

export const DiscoveryResultCard = memo(function DiscoveryResultCard({
  result,
  showRaw,
}: DiscoveryResultCardProps) {
  const friendlyDocumentName = redactSensitiveText(
    formatDocumentName(result.documentName),
  );
  const hasSummary = Boolean(result.summary && result.summary.trim());
  const redactedSummary = hasSummary
    ? redactSensitiveText(result.summary)
    : null;
  const displayTitle = redactedSummary ?? friendlyDocumentName;
  const redactedDocumentTitle = redactSensitiveText(result.documentName);
  const redactedSource = result.source
    ? redactSensitiveText(result.source)
    : null;
  const redactedIndexType = result.indexType
    ? redactSensitiveText(result.indexType)
    : null;
  const redactedLabel = result.label ? redactSensitiveText(result.label) : null;
  const redactedStruct = redactJsonForDisplay(result.struct);
  const redactedRawPayload = redactJsonForDisplay(result.raw);

  return (
    <Card key={`${result.rank}-${result.documentId}`} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
              #{result.rank}
            </span>
            {redactedSource ? (
              <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-600">
                {redactedSource}
              </span>
            ) : null}
            {redactedIndexType && redactedIndexType !== redactedSource ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">
                {redactedIndexType}
              </span>
            ) : null}
          </div>
          <h3
            className="mt-2 text-lg font-semibold text-slate-900"
            title={redactedDocumentTitle}
          >
            {displayTitle}
          </h3>
          <p className="text-sm text-slate-500" title={redactedDocumentTitle}>
            Case: {friendlyDocumentName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {redactedLabel ? (
            <Badge variant="info">Label: {redactedLabel}</Badge>
          ) : null}
          <Badge variant="default">
            ID {formatDocumentId(result.documentId)}
          </Badge>
        </div>
      </div>
      {redactedSummary ? (
        <p className="text-sm text-slate-600">{redactedSummary}</p>
      ) : null}
      {result.tags.length ? (
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {result.tags.map((tag) => (
            <Badge key={`${result.documentId}-${tag}`} variant="default">
              #{redactSensitiveText(tag)}
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
            {redactedStruct}
          </pre>
        </details>
      ) : null}
      {showRaw ? (
        <details className="rounded-xl border border-slate-100 bg-white/40 p-4 text-xs text-slate-500">
          <summary className="cursor-pointer font-semibold text-slate-600">
            Raw payload
          </summary>
          <pre className="mt-3 whitespace-pre-wrap break-all text-[11px] text-slate-500">
            {redactedRawPayload}
          </pre>
        </details>
      ) : null}
    </Card>
  );
});

DiscoveryResultCard.displayName = "DiscoveryResultCard";

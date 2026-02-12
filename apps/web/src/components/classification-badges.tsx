"use client";

import { Badge } from "@i4g/ui-kit";
import type { FraudClassificationResult, TaxonomyResponse } from "@i4g/sdk";
import { getTaxonomyDescription } from "@/lib/taxonomy";

/** Maps each classification axis to a Badge variant. */
const axisConfig = [
  { key: "intent", prefix: "Intent", variant: "danger" },
  { key: "channel", prefix: "Channel", variant: "info" },
  { key: "techniques", prefix: "Technique", variant: "warning" },
  { key: "actions", prefix: "Action", variant: "default" },
  { key: "persona", prefix: "Persona", variant: "default" },
] as const;

export interface ClassificationBadgesProps {
  /** The classification result attached to a search result or case. */
  classification: FraudClassificationResult | null | undefined;
  /** Full taxonomy definition used to resolve tooltip descriptions. */
  taxonomy: TaxonomyResponse;
  /** Fallback tags rendered as `#tag` badges when classification is absent. */
  tags?: string[];
  /** Optional prefix for React keys (e.g. the parent item id). */
  keyPrefix?: string;
}

/**
 * Renders fraud-classification badges per axis with tooltip descriptions,
 * falling back to `#tag` badges when no classification is present.
 */
export function ClassificationBadges({
  classification,
  taxonomy,
  tags = [],
  keyPrefix = "",
}: ClassificationBadgesProps) {
  if (classification) {
    return (
      <>
        {axisConfig.map(({ key, prefix, variant }) =>
          (classification[key] ?? []).map(
            (
              item: { label: string; explanation?: string | null },
              i: number,
            ) => (
              <Badge
                key={`${keyPrefix}${key}-${i}`}
                variant={variant}
                title={
                  item.explanation ||
                  getTaxonomyDescription(taxonomy, item.label)
                }
              >
                {prefix}: {item.label}
              </Badge>
            ),
          ),
        )}
      </>
    );
  }

  return (
    <>
      {tags.map((tag, idx) => (
        <Badge key={`${keyPrefix}tag-${tag}-${idx}`} variant="default">
          #{tag}
        </Badge>
      ))}
    </>
  );
}

"use client";

import { HelpTooltip, InfoPopover } from "@i4g/ui-kit";
import { getHelpEntry } from "@/content/help";
import type { ReactNode } from "react";

interface HelpKeyProps {
  /** Help registry key, e.g. "case.classification.riskScore" */
  helpKey: string;
  /** Override tooltip side. */
  side?: "top" | "right" | "bottom" | "left";
  /** Optional custom trigger. */
  children?: ReactNode;
  /** Additional class names on the trigger. */
  className?: string;
}

/**
 * Inline field-level help — renders a `<HelpTooltip>` using content from
 * the help registry. Renders nothing if the key is not found.
 */
export function FieldHelp({
  helpKey,
  side = "top",
  children,
  className,
}: HelpKeyProps) {
  const entry = getHelpEntry(helpKey);
  if (!entry) return null;

  return (
    <HelpTooltip
      title={entry.title}
      content={entry.body}
      side={side}
      className={className}
      aria-label={`Help: ${entry.title}`}
    >
      {children}
    </HelpTooltip>
  );
}

/**
 * Rich contextual help — renders an `<InfoPopover>` using content from
 * the help registry. Renders nothing if the key is not found.
 */
export function SectionHelp({
  helpKey,
  side = "bottom",
  children,
  className,
}: HelpKeyProps) {
  const entry = getHelpEntry(helpKey);
  if (!entry) return null;

  return (
    <InfoPopover
      title={entry.title}
      content={entry.body}
      docUrl={entry.docUrl}
      docLabel={entry.docLabel}
      side={side}
      className={className}
      aria-label={`Info: ${entry.title}`}
    >
      {children}
    </InfoPopover>
  );
}

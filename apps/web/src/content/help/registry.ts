/**
 * Help entry type and global registry.
 *
 * Each help entry has a unique `key` that components use to look up content.
 * Keys follow the pattern: `{page}.{section}.{field}`.
 */

export interface HelpEntry {
  /** Unique lookup key, e.g. "case.classification.riskScore" */
  key: string;
  /** Short title shown in tooltip header */
  title: string;
  /** Markdown body — keep concise for tooltips, can be longer for popovers */
  body: string;
  /** Optional link to full documentation */
  docUrl?: string;
  /** Optional link label (defaults to "Learn more") */
  docLabel?: string;
}

import { caseReviewHelp } from "./case-review";
import { searchHelp } from "./search";
import { classificationHelp } from "./classification";
import { dossierHelp } from "./dossier";

/** All help entries, keyed by their `key` field. */
export const helpEntries: Record<string, HelpEntry> = {};

for (const entry of [
  ...caseReviewHelp,
  ...searchHelp,
  ...classificationHelp,
  ...dossierHelp,
]) {
  helpEntries[entry.key] = entry;
}

/** Look up a help entry by key. Returns `undefined` if not found. */
export function getHelpEntry(key: string): HelpEntry | undefined {
  return helpEntries[key];
}

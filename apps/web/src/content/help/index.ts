/**
 * Help content registry — static JSON with markdown content, keyed by topic.
 *
 * Architecture: Option (a) from WS-4 design decisions.
 * Help entries are co-located with the UI build for simplicity, versioned in
 * git, and consumed by `<HelpTooltip>` / `<InfoPopover>` via a lookup hook.
 * No API overhead — content ships with the Next.js bundle.
 *
 * Progressive enhancement to an API-served model can be added later if the
 * content corpus grows significantly.
 */

export { caseReviewHelp } from "./case-review";
export { searchHelp } from "./search";
export { classificationHelp } from "./classification";
export { dossierHelp } from "./dossier";
export { helpEntries, getHelpEntry, type HelpEntry } from "./registry";

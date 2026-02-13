import type { HelpEntry } from "./registry";

/**
 * Help content for the case review workflow.
 *
 * Covers the case detail page: narrative, timeline, classification,
 * artifacts, status, priority, and analyst actions.
 */
export const caseReviewHelp: HelpEntry[] = [
  {
    key: "case.overview",
    title: "Case Review Workflow",
    body: "Review cases assigned to your queue. Assess the evidence, update the classification if needed, and submit your determination. Each action you take is logged for audit purposes.",
    docUrl: "https://docs.intelligenceforgood.org/book/guides/case-review",
  },
  {
    key: "case.narrative",
    title: "Case Narrative",
    body: "The narrative summarizes the fraud scenario — extracted from ingested documents, tipster submissions, or analyst notes. Review it for completeness before classifying.",
  },
  {
    key: "case.timeline",
    title: "Timeline",
    body: "A chronological record of all events related to this case: ingestion, classification changes, analyst actions, and status transitions. Events are system-generated and immutable.",
  },
  {
    key: "case.status",
    title: "Case Status",
    body: 'Cases progress through: "new" → "open" → "in_review" → "resolved" / "escalated". Only analysts assigned to the case can change its status.',
  },
  {
    key: "case.priority",
    title: "Priority",
    body: "Priority is derived from the risk score at ingestion time. High-risk cases (score ≥ 75) are flagged as critical. Analysts can manually override priority with justification.",
  },
  {
    key: "case.classification",
    title: "Classification",
    body: "Each case is classified across five taxonomy axes: intent, channel, techniques, actions, and persona. The classification drives the risk score and determines routing.",
    docUrl: "https://docs.intelligenceforgood.org/book/guides/classification",
  },
  {
    key: "case.classification.riskScore",
    title: "Risk Score",
    body: "A composite score (0–100) computed from weighted classification axis values. Formula: (sum of axis weights × 2.5), capped at 100. Higher scores indicate greater fraud likelihood and are used for queue prioritization.",
  },
  {
    key: "case.classification.taxonomyVersion",
    title: "Taxonomy Version",
    body: "The version of the fraud taxonomy used for this classification. When the taxonomy is updated, cases can be reclassified by the sweeper job. The version tag ensures traceability.",
  },
  {
    key: "case.artifacts",
    title: "Artifacts",
    body: "Evidence files attached to this case — documents, screenshots, chat logs, or financial records. Each artifact links to the original source and has a chain-of-custody hash.",
  },
  {
    key: "case.feedback",
    title: "Analyst Feedback",
    body: "Submit corrections to the automated classification. Your feedback is stored as a golden-dataset candidate and reviewed by curators before being promoted to improve model accuracy.",
    docUrl: "https://docs.intelligenceforgood.org/book/guides/feedback",
  },
];

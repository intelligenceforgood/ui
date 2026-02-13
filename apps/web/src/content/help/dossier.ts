import type { HelpEntry } from "./registry";

/**
 * Help content for the dossier/report generation workflow.
 *
 * Covers evidence dossier lifecycle, LEO report generation,
 * report status, and verification.
 */
export const dossierHelp: HelpEntry[] = [
  {
    key: "dossier.overview",
    title: "Evidence Dossiers",
    body: "Dossiers compile all evidence for a case into a structured report suitable for law enforcement referral. Generation runs as a background job and progress is tracked in real time.",
    docUrl: "https://docs.intelligenceforgood.org/book/guides/dossiers",
  },
  {
    key: "dossier.generation",
    title: "Generating a Dossier",
    body: "Trigger generation from a case detail page. The system collects all artifacts, classification data, timeline events, and tokenized PII references into a formatted report. Status updates are pushed until completion.",
  },
  {
    key: "dossier.status",
    title: "Dossier Status",
    body: '"pending" — queued for generation. "processing" — actively building the report. "complete" — ready for download and review. "failed" — generation encountered an error; check the job log for details.',
  },
  {
    key: "dossier.verification",
    title: "Verification",
    body: "Each dossier includes a verification manifest listing the evidence files, their SHA-256 hashes, and timestamps. This chain-of-custody record ensures evidentiary integrity for legal proceedings.",
  },
  {
    key: "dossier.leoReport",
    title: "LEO Report",
    body: "Law Enforcement Officer reports are formatted versions of dossiers that follow agency submission guidelines. They include a structured narrative, evidence inventory, and subject identifiers.",
    docUrl: "https://docs.intelligenceforgood.org/book/guides/leo-reports",
  },
  {
    key: "dossier.piiHandling",
    title: "PII in Reports",
    body: "Tokenized PII is included in dossiers in its original form for investigative purposes. Access to generated dossiers is restricted to authorized roles. All access events are logged.",
  },
];

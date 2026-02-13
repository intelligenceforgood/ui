import type { HelpEntry } from "./registry";

/**
 * Help content for the 5-axis fraud taxonomy classification system.
 *
 * Each axis has a dedicated entry explaining what it represents,
 * plus a general entry for the overall classification model.
 */
export const classificationHelp: HelpEntry[] = [
  {
    key: "classification.overview",
    title: "5-Axis Classification Model",
    body: "Every case is classified across five orthogonal fraud taxonomy axes. The combination of axes provides a multi-dimensional view of the fraud scenario, enabling precise routing, reporting, and pattern detection.",
    docUrl: "https://docs.intelligenceforgood.org/book/guides/classification",
  },
  {
    key: "classification.intent",
    title: "Intent",
    body: "The fraudster's primary goal — what they are trying to achieve. Examples: financial theft, identity theft, romance exploitation, impersonation for access. Intent carries the highest risk weight in scoring.",
    docUrl:
      "https://docs.intelligenceforgood.org/book/guides/classification#intent",
  },
  {
    key: "classification.channel",
    title: "Channel",
    body: "The communication medium used to execute the fraud. Examples: email, phone/SMS, social media, dating apps, in-person, postal mail. Channel helps identify attack vectors and informs prevention strategies.",
    docUrl:
      "https://docs.intelligenceforgood.org/book/guides/classification#channel",
  },
  {
    key: "classification.techniques",
    title: "Techniques",
    body: "The specific methods and tactics employed. Examples: phishing, social engineering, fake investment platforms, advance-fee schemes, deepfake voice/video. Multiple techniques can be tagged per case.",
    docUrl:
      "https://docs.intelligenceforgood.org/book/guides/classification#techniques",
  },
  {
    key: "classification.actions",
    title: "Actions Requested",
    body: "What the fraudster asks the victim to do. Examples: wire transfer, gift card purchase, crypto transfer, share credentials, install remote access software. Actions carry high risk weights for scoring.",
    docUrl:
      "https://docs.intelligenceforgood.org/book/guides/classification#actions",
  },
  {
    key: "classification.persona",
    title: "Persona",
    body: "The identity or role the fraudster assumes. Examples: government official, tech support, romantic partner, investment advisor, family member in distress. Persona detection aids in pattern analysis across cases.",
    docUrl:
      "https://docs.intelligenceforgood.org/book/guides/classification#persona",
  },
  {
    key: "classification.riskScore",
    title: "Risk Score Formula",
    body: "Risk score = (Σ axis_weight × 2.5), capped at 100. Weights are defined per taxonomy code in definitions.yaml. Intent weights range 5–10, technique weights 4–9, action weights 6–9. Higher scores trigger priority routing.",
  },
  {
    key: "classification.confidence",
    title: "Confidence Score",
    body: "Each axis label includes a confidence score (0–1) from the LLM classifier. Low-confidence classifications (< 0.6) are flagged for analyst review. Feedback on incorrect labels improves future accuracy.",
  },
  {
    key: "classification.sweeper",
    title: "Classification Sweeper",
    body: "A batch job that re-evaluates existing classifications when the taxonomy or LLM model is updated. Reclassified cases show the new taxonomy version. Drift metrics track how many cases change class per run.",
  },
];

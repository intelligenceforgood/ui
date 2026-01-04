/**
 * Fraud Taxonomy Enums
 * Version: fraud-taxonomy.v1.0
 *
 * Auto-generated from definitions.yaml. DO NOT EDIT.
 */

export enum ScamIntent {
  /** Pretending to be a trusted entity */
  IMPOSTER = "INTENT.IMPOSTER",
  /** Promises of financial returns */
  INVESTMENT = "INTENT.INVESTMENT",
  /** Emotional relationship for fraud */
  ROMANCE = "INTENT.ROMANCE",
  /** Fake job or task-based fraud */
  EMPLOYMENT = "INTENT.EMPLOYMENT",
  /** Fake goods or sellers */
  SHOPPING = "INTENT.SHOPPING",
  /** Fake tech assistance */
  TECH_SUPPORT = "INTENT.TECH_SUPPORT",
  /** Fake winnings */
  PRIZE = "INTENT.PRIZE",
  /** Threat-based coercion */
  EXTORTION = "INTENT.EXTORTION",
  /** Fake disaster or cause appeals */
  CHARITY = "INTENT.CHARITY",
}

export const ScamIntentDescriptions: Record<ScamIntent, string> = {
  [ScamIntent.IMPOSTER]: "Pretending to be a trusted entity",
  [ScamIntent.INVESTMENT]: "Promises of financial returns",
  [ScamIntent.ROMANCE]: "Emotional relationship for fraud",
  [ScamIntent.EMPLOYMENT]: "Fake job or task-based fraud",
  [ScamIntent.SHOPPING]: "Fake goods or sellers",
  [ScamIntent.TECH_SUPPORT]: "Fake tech assistance",
  [ScamIntent.PRIZE]: "Fake winnings",
  [ScamIntent.EXTORTION]: "Threat-based coercion",
  [ScamIntent.CHARITY]: "Fake disaster or cause appeals",
};

export enum DeliveryChannel {
  /** Communication via email */
  EMAIL = "CHANNEL.EMAIL",
  /** Text messages or SMS */
  SMS = "CHANNEL.SMS",
  /** WhatsApp, Telegram, Signal, etc. */
  CHAT = "CHANNEL.CHAT",
  /** Facebook, Instagram, Twitter, LinkedIn, etc. */
  SOCIAL = "CHANNEL.SOCIAL",
  /** Voice calls */
  PHONE = "CHANNEL.PHONE",
  /** Malicious websites or landing pages */
  WEB = "CHANNEL.WEB",
}

export const DeliveryChannelDescriptions: Record<DeliveryChannel, string> = {
  [DeliveryChannel.EMAIL]: "Communication via email",
  [DeliveryChannel.SMS]: "Text messages or SMS",
  [DeliveryChannel.CHAT]: "WhatsApp, Telegram, Signal, etc.",
  [DeliveryChannel.SOCIAL]: "Facebook, Instagram, Twitter, LinkedIn, etc.",
  [DeliveryChannel.PHONE]: "Voice calls",
  [DeliveryChannel.WEB]: "Malicious websites or landing pages",
};

export enum SocialEngineeringTechnique {
  /** Time pressure, deadlines */
  URGENCY = "SE.URGENCY",
  /** Government, bank, employer tone */
  AUTHORITY = "SE.AUTHORITY",
  /** Limited availability */
  SCARCITY = "SE.SCARCITY",
  /** Threats, loss, legal trouble */
  FEAR = "SE.FEAR",
  /** Gifts, favors */
  RECIPROCITY = "SE.RECIPROCITY",
  /** Long-term rapport */
  TRUST_BUILDING = "SE.TRUST_BUILDING",
  /** Overwhelming steps */
  CONFUSION = "SE.CONFUSION",
}

export const SocialEngineeringTechniqueDescriptions: Record<
  SocialEngineeringTechnique,
  string
> = {
  [SocialEngineeringTechnique.URGENCY]: "Time pressure, deadlines",
  [SocialEngineeringTechnique.AUTHORITY]: "Government, bank, employer tone",
  [SocialEngineeringTechnique.SCARCITY]: "Limited availability",
  [SocialEngineeringTechnique.FEAR]: "Threats, loss, legal trouble",
  [SocialEngineeringTechnique.RECIPROCITY]: "Gifts, favors",
  [SocialEngineeringTechnique.TRUST_BUILDING]: "Long-term rapport",
  [SocialEngineeringTechnique.CONFUSION]: "Overwhelming steps",
};

export enum RequestedAction {
  /** Direct money transfer */
  SEND_MONEY = "ACTION.SEND_MONEY",
  /** Purchase and share gift card codes */
  GIFT_CARDS = "ACTION.GIFT_CARDS",
  /** Send crypto to a wallet address */
  CRYPTO = "ACTION.CRYPTO",
  /** Provide login details or passwords */
  CREDENTIALS = "ACTION.CREDENTIALS",
  /** Download and install apps or remote access tools */
  INSTALL = "ACTION.INSTALL",
  /** Visit a specific URL */
  CLICK_LINK = "ACTION.CLICK_LINK",
  /** Share SSN, ID, or other sensitive info */
  PROVIDE_PII = "ACTION.PROVIDE_PII",
}

export const RequestedActionDescriptions: Record<RequestedAction, string> = {
  [RequestedAction.SEND_MONEY]: "Direct money transfer",
  [RequestedAction.GIFT_CARDS]: "Purchase and share gift card codes",
  [RequestedAction.CRYPTO]: "Send crypto to a wallet address",
  [RequestedAction.CREDENTIALS]: "Provide login details or passwords",
  [RequestedAction.INSTALL]: "Download and install apps or remote access tools",
  [RequestedAction.CLICK_LINK]: "Visit a specific URL",
  [RequestedAction.PROVIDE_PII]: "Share SSN, ID, or other sensitive info",
};

export enum ClaimedPersona {
  /** IRS, FBI, Police, etc. */
  GOVERNMENT = "PERSONA.GOVERNMENT",
  /** Chase, Wells Fargo, PayPal, etc. */
  BANK = "PERSONA.BANK",
  /** Microsoft, Apple, Amazon support */
  TECH = "PERSONA.TECH",
  /** Recruiter, Boss, CEO */
  EMPLOYER = "PERSONA.EMPLOYER",
  /** Boyfriend, Girlfriend, Match */
  ROMANTIC = "PERSONA.ROMANTIC",
  /** Facebook Marketplace, Craigslist user */
  MARKETPLACE = "PERSONA.MARKETPLACE",
  /** Red Cross, GoFundMe, etc. */
  CHARITY = "PERSONA.CHARITY",
}

export const ClaimedPersonaDescriptions: Record<ClaimedPersona, string> = {
  [ClaimedPersona.GOVERNMENT]: "IRS, FBI, Police, etc.",
  [ClaimedPersona.BANK]: "Chase, Wells Fargo, PayPal, etc.",
  [ClaimedPersona.TECH]: "Microsoft, Apple, Amazon support",
  [ClaimedPersona.EMPLOYER]: "Recruiter, Boss, CEO",
  [ClaimedPersona.ROMANTIC]: "Boyfriend, Girlfriend, Match",
  [ClaimedPersona.MARKETPLACE]: "Facebook Marketplace, Craigslist user",
  [ClaimedPersona.CHARITY]: "Red Cross, GoFundMe, etc.",
};

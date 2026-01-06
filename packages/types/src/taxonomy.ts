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

export const ScamIntentLabels: Record<ScamIntent, string> = {
  [ScamIntent.IMPOSTER]: "Imposter",
  [ScamIntent.INVESTMENT]: "Investment",
  [ScamIntent.ROMANCE]: "Romance",
  [ScamIntent.EMPLOYMENT]: "Employment",
  [ScamIntent.SHOPPING]: "Shopping",
  [ScamIntent.TECH_SUPPORT]: "Tech Support",
  [ScamIntent.PRIZE]: "Prize",
  [ScamIntent.EXTORTION]: "Extortion",
  [ScamIntent.CHARITY]: "Charity",
};

export const ScamIntentExamples: Record<ScamIntent, string[]> = {
  [ScamIntent.IMPOSTER]: [
    "Hi Grandma, it's me, I'm in trouble in Mexico and lost my wallet.",
    "This is IRS agent Smith, you owe back taxes.",
    "I am a prince from Nigeria and need your help moving funds.",
  ],
  [ScamIntent.INVESTMENT]: [
    "Guaranteed 20% weekly returns on our new crypto platform.",
    "Exclusive pre-IPO opportunity for selected investors only.",
    "Our AI trading bot never loses money.",
  ],
  [ScamIntent.ROMANCE]: [
    "I wish I could meet you but I'm deployed overseas right now.",
    "My camera is broken so we can't video chat yet.",
    "I need money for a plane ticket to come see you.",
  ],
  [ScamIntent.EMPLOYMENT]: [
    "Earn $5000/week working from home, no experience needed.",
    "Please pay $200 for your background check equipment shipping.",
    "Data entry job: process these checks through your personal account.",
  ],
  [ScamIntent.SHOPPING]: [
    "PS5 console for $200 - limited time offer!",
    "Webstore with no physical address or contact info.",
    "Seller asks for payment via Friends & Family only.",
  ],
  [ScamIntent.TECH_SUPPORT]: [
    "Your computer has a virus! Call Microsoft Support immediately.",
    "We detected suspicious activity on your IP address.",
    "Please install AnyDesk so I can fix your drivers.",
  ],
  [ScamIntent.PRIZE]: [
    "Congratulations! You won a $1000 Walmart Gift Card.",
    "You've been selected for a free iPhone 15.",
    "Pay processing fees to claim your lottery jackpot.",
  ],
  [ScamIntent.EXTORTION]: [
    "I recorded you on your webcam, pay BTC or I send it to your contacts.",
    "We have your SSN and will leak it unless you pay.",
    "If you don't pay the fine, the police will arrest you in 1 hour.",
  ],
  [ScamIntent.CHARITY]: [
    "Donate to the victims of the recent earthquake via this personal PayPal.",
    "Help feed hungry children, send crypto now.",
    "Urgent medical funds needed for a dog surgery (stolen photos).",
  ],
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

export const DeliveryChannelLabels: Record<DeliveryChannel, string> = {
  [DeliveryChannel.EMAIL]: "Email",
  [DeliveryChannel.SMS]: "SMS",
  [DeliveryChannel.CHAT]: "Chat",
  [DeliveryChannel.SOCIAL]: "Social Media",
  [DeliveryChannel.PHONE]: "Phone",
  [DeliveryChannel.WEB]: "Web",
};

export const DeliveryChannelExamples: Record<DeliveryChannel, string[]> = {
  [DeliveryChannel.EMAIL]: [
    "Phishing link sent from 'support@amaz0n.com'.",
    "CEO Fraud email asking for urgent wire transfer.",
  ],
  [DeliveryChannel.SMS]: [
    "USPS: Your package delivery failed, click here.",
    "Bank Alert: Did you spend $500? Reply Y or N.",
  ],
  [DeliveryChannel.CHAT]: [
    "Let's move to WhatsApp for better privacy.",
    "Telegram group offering 'pump and dump' signals.",
  ],
  [DeliveryChannel.SOCIAL]: [
    "Instagram DM from a stranger complimenting your photos.",
    "LinkedIn message from a 'recruiter' with a generic profile.",
  ],
  [DeliveryChannel.PHONE]: [
    "Robocall about your car's extended warranty.",
    "Live caller claiming to be from the Social Security Administration.",
  ],
  [DeliveryChannel.WEB]: [
    "Fake crypto exchange login page.",
    "Pop-up warning that your browser is infected.",
  ],
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

export const SocialEngineeringTechniqueLabels: Record<
  SocialEngineeringTechnique,
  string
> = {
  [SocialEngineeringTechnique.URGENCY]: "Urgency",
  [SocialEngineeringTechnique.AUTHORITY]: "Authority",
  [SocialEngineeringTechnique.SCARCITY]: "Scarcity",
  [SocialEngineeringTechnique.FEAR]: "Fear",
  [SocialEngineeringTechnique.RECIPROCITY]: "Reciprocity",
  [SocialEngineeringTechnique.TRUST_BUILDING]: "Trust Building",
  [SocialEngineeringTechnique.CONFUSION]: "Confusion",
};

export const SocialEngineeringTechniqueExamples: Record<
  SocialEngineeringTechnique,
  string[]
> = {
  [SocialEngineeringTechnique.URGENCY]: [
    "Offer expires in 10 minutes!",
    "Act now or your account will be permanently closed.",
  ],
  [SocialEngineeringTechnique.AUTHORITY]: [
    "This is Officer Johnson from the local precinct.",
    "CEO requesting immediate action.",
  ],
  [SocialEngineeringTechnique.SCARCITY]: [
    "Only 2 spots left in the investment pool.",
    "Last chance to buy at this price.",
  ],
  [SocialEngineeringTechnique.FEAR]: [
    "Your social security number has been suspended.",
    "A warrant has been issued for your arrest.",
  ],
  [SocialEngineeringTechnique.RECIPROCITY]: [
    "I'll give you a free bonus if you sign up now.",
    "I helped you, now you need to help me move this money.",
  ],
  [SocialEngineeringTechnique.TRUST_BUILDING]: [
    "Talking for weeks about daily life and family before mentioning money.",
    "Sending small gifts to build confidence.",
  ],
  [SocialEngineeringTechnique.CONFUSION]: [
    "Complex crypto withdrawal instructions designed to confuse.",
    "Technical jargon used to intimidate the victim.",
  ],
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

export const RequestedActionLabels: Record<RequestedAction, string> = {
  [RequestedAction.SEND_MONEY]: "Send Money",
  [RequestedAction.GIFT_CARDS]: "Gift Cards",
  [RequestedAction.CRYPTO]: "Crypto",
  [RequestedAction.CREDENTIALS]: "Credentials",
  [RequestedAction.INSTALL]: "Install Software",
  [RequestedAction.CLICK_LINK]: "Click Link",
  [RequestedAction.PROVIDE_PII]: "Provide PII",
};

export const RequestedActionExamples: Record<RequestedAction, string[]> = {
  [RequestedAction.SEND_MONEY]: [
    "Wire transfer to an overseas bank account.",
    "Zelle or Venmo payment to a stranger.",
  ],
  [RequestedAction.GIFT_CARDS]: [
    "Buy $500 iTunes cards and send me the codes.",
    "Pay your utility bill with Target gift cards.",
  ],
  [RequestedAction.CRYPTO]: [
    "Deposit BTC to this wallet address to unlock your account.",
    "Invest USDT in this liquidity mining pool.",
  ],
  [RequestedAction.CREDENTIALS]: [
    "Log in to your bank to verify your identity.",
    "Provide your 2FA code to the 'support agent'.",
  ],
  [RequestedAction.INSTALL]: [
    "Download AnyDesk or TeamViewer for remote support.",
    "Install this 'trading app' (APK file) directly.",
  ],
  [RequestedAction.CLICK_LINK]: [
    "Click here to track your package.",
    "Review document via this secure link.",
  ],
  [RequestedAction.PROVIDE_PII]: [
    "What is your mother's maiden name?",
    "Send a photo of your driver's license.",
  ],
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

export const ClaimedPersonaLabels: Record<ClaimedPersona, string> = {
  [ClaimedPersona.GOVERNMENT]: "Government",
  [ClaimedPersona.BANK]: "Bank",
  [ClaimedPersona.TECH]: "Tech Support",
  [ClaimedPersona.EMPLOYER]: "Employer",
  [ClaimedPersona.ROMANTIC]: "Romantic Partner",
  [ClaimedPersona.MARKETPLACE]: "Marketplace User",
  [ClaimedPersona.CHARITY]: "Charity",
};

export const ClaimedPersonaExamples: Record<ClaimedPersona, string[]> = {
  [ClaimedPersona.GOVERNMENT]: [
    "IRS Agent claiming tax fraud.",
    "FBI agent investigating your bank account.",
  ],
  [ClaimedPersona.BANK]: [
    "Chase Fraud Department calling about suspicious charges.",
    "PayPal support email regarding a transaction dispute.",
  ],
  [ClaimedPersona.TECH]: [
    "Amazon support claiming an unauthorized iPhone purchase.",
    "Microsoft technician fixing a virus.",
  ],
  [ClaimedPersona.EMPLOYER]: [
    "Recruiter offering a dream job.",
    "CEO emailing asking for gift cards for employees.",
  ],
  [ClaimedPersona.ROMANTIC]: [
    "US Soldier deployed abroad.",
    "Successful business owner looking for love.",
  ],
  [ClaimedPersona.MARKETPLACE]: [
    "Buyer claiming they paid but need insurance fee.",
    "Seller offering to ship item after payment.",
  ],
  [ClaimedPersona.CHARITY]: [
    "Volunteer collecting for disaster relief.",
    "Representative of a fake animal shelter.",
  ],
};

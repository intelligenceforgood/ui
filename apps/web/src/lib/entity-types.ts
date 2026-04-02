/**
 * Entity type label utilities — convert internal entity type identifiers
 * to user-friendly display labels.
 */

/** Maps canonical entity type IDs to display labels. */
const ENTITY_TYPE_LABELS: Record<string, string> = {
  person: "Person",
  organization: "Organization",
  phone_number: "Phone Number",
  account_number: "Account Number",
  routing_number: "Routing Number",
  wallet_address: "Wallet Address",
  transaction_id: "Transaction ID",
  ticket_id: "Ticket ID",
  location: "Location",
  bank: "Bank",
  bank_account: "Bank Account",
  agency: "Agency",
  retailer: "Retailer",
  social_handle: "Social Handle",
  crypto_token: "Crypto Token",
  scam_indicator: "Scam Indicator",
  email_address: "Email Address",
  url: "URL",
  domain: "Domain",
  ip_address: "IP Address",
  payment_handle: "Payment Handle",
  contact_handle: "Contact Handle",
  software: "Software",
};

/**
 * Return a user-friendly display label for a canonical entity type.
 *
 * Falls back to replacing underscores with spaces and title-casing.
 */
export function entityTypeLabel(entityType: string): string {
  if (entityType in ENTITY_TYPE_LABELS) {
    return ENTITY_TYPE_LABELS[entityType]!;
  }
  return entityType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Maps canonical entity type IDs to graph visualization colours.
 *
 * Colour choices align with the graph legend and node rendering.
 */
export const ENTITY_TYPE_COLORS: Record<string, string> = {
  wallet_address: "#ef4444",
  email_address: "#3b82f6",
  phone_number: "#10b981",
  ip_address: "#f59e0b",
  domain: "#8b5cf6",
  url: "#ec4899",
  person: "#6366f1",
  organization: "#0ea5e9",
  bank: "#14b8a6",
  bank_account: "#14b8a6",
  social_handle: "#a855f7",
  payment_handle: "#f97316",
  scam_indicator: "#f43f5e",
  location: "#84cc16",
  contact_handle: "#06b6d4",
  crypto_token: "#eab308",
};

const DEFAULT_ENTITY_COLOR = "#6b7280";

/** Return the display colour for an entity type. */
export function entityTypeColor(entityType: string): string {
  return ENTITY_TYPE_COLORS[entityType] ?? DEFAULT_ENTITY_COLOR;
}

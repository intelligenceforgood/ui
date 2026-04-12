/**
 * Entity value display formatters.
 *
 * Raw canonical values are stored unformatted (digits only for phones, etc.).
 * This module formats them for human-readable display while keeping the
 * underlying data untouched.
 *
 * To add a new formatter, register it in {@link ENTITY_FORMATTERS}.
 */

type EntityFormatter = (value: string) => string;

// ---------------------------------------------------------------------------
// Individual formatters
// ---------------------------------------------------------------------------

/** Format a 10-digit US / 11-digit (1+10) / 12+ international phone number. */
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  // International: +CC remaining digits grouped in threes
  if (digits.length >= 7) {
    return `+${digits.slice(0, digits.length % 3 || 3)} ${digits
      .slice(digits.length % 3 || 3)
      .replace(/(\d{3})(?=\d)/g, "$1 ")}`;
  }
  return value;
}

/** Format bank account: groups of 4 separated by spaces. */
function formatBankAccount(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return value;
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** Format routing number: XXX-XXX-XXX (US ABA). */
function formatRoutingNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value;
}

/** Format wallet address: first 6 … last 4 (long addresses only). */
function formatWalletAddress(value: string): string {
  if (value.length > 16) {
    return `${value.slice(0, 6)}…${value.slice(-4)}`;
  }
  return value;
}

/** Format transaction ID: first 8 … last 6 (long hashes only). */
function formatTransactionId(value: string): string {
  if (value.length > 20) {
    return `${value.slice(0, 8)}…${value.slice(-6)}`;
  }
  return value;
}

/** Format IP address — already readable; just pass through. */
function formatIpAddress(value: string): string {
  return value;
}

/** Format email — already readable; just lowercase. */
function formatEmail(value: string): string {
  return value.toLowerCase();
}

/** Format URL — strip trailing slash for cleanliness. */
function formatUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * Maps entity type IDs to their display formatter.
 *
 * Entity types not in this map are displayed as-is.  To add formatting for a
 * new entity type, add a function here — no other changes needed.
 */
const ENTITY_FORMATTERS: Record<string, EntityFormatter> = {
  phone_number: formatPhone,
  bank_account: formatBankAccount,
  account_number: formatBankAccount,
  routing_number: formatRoutingNumber,
  wallet_address: formatWalletAddress,
  transaction_id: formatTransactionId,
  ip_address: formatIpAddress,
  email_address: formatEmail,
  url: formatUrl,
};

/**
 * Format an entity's canonical value for display.
 *
 * Looks up the entity type in the formatter registry and applies the
 * matching formatter.  Returns the raw value unchanged for unknown types.
 */
export function formatEntityValue(
  entityType: string,
  canonicalValue: string,
): string {
  const formatter = ENTITY_FORMATTERS[entityType];
  return formatter ? formatter(canonicalValue) : canonicalValue;
}

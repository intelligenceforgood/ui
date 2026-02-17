/**
 * Human-readable labels for PII token prefixes.
 *
 * Mirrors the authoritative `_ENTITY_PREFIX_MAP` in
 * `core/src/i4g/pii/tokenization.py`.
 */
export const PII_LABELS: Record<string, string> = {
  // Identity / Contact
  EID: "Email Address",
  NAM: "Person Name",
  PHN: "Phone Number",
  ADR: "Address",
  DOB: "Date of Birth",
  // Government / Identity
  TIN: "SSN / Tax ID",
  PID: "Passport ID",
  SID: "State-Issued ID",
  EMP: "Employee ID",
  GOV: "Government ID",
  ETX: "Employer Tax ID",
  STX: "Student Record ID",
  // Financial
  CCN: "Credit Card",
  BAN: "Bank Account",
  IBN: "IBAN",
  RTN: "Routing Number",
  SWF: "SWIFT / BIC Code",
  ACH: "ACH ID",
  // Crypto
  BTC: "Bitcoin Address",
  ETH: "Ethereum Address",
  WLT: "Crypto Wallet",
  // Network / Device
  IPA: "IP Address",
  ASN: "AS Number",
  MAC: "MAC Address",
  DID: "Device ID",
  BFP: "Browser Fingerprint",
  CID: "Cookie / Session ID",
  // Health / Medical
  HID: "Health ID",
  MRN: "Medical Record",
  NHI: "National Health ID",
  // Biometric
  BIO: "Biometric Hash",
  // Legal / Vehicle
  VIN: "Vehicle ID (VIN)",
  LPL: "License Plate",
  DOC: "Document ID",
  // Location
  LOC: "Geolocation",
  PLC: "Place ID",
  // Fallback
  UNK: "Unknown PII",
};

"use client";

import { Fragment, memo, useMemo } from "react";

/**
 * PII token prefix → human-readable label.
 *
 * Mirrors the authoritative `_ENTITY_PREFIX_MAP` in
 * `core/src/i4g/pii/tokenization.py`.
 */
const PII_LABELS: Record<string, string> = {
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

/**
 * Matches PII tokens: 3 uppercase letters + hyphen + 8 uppercase hex chars.
 * e.g. DOB-211FE712, TIN-D0701A05
 */
const PII_TOKEN_REGEX = /\b([A-Z]{3})-([0-9A-F]{8})\b/g;

type TextSegment =
  | { kind: "text"; value: string }
  | { kind: "token"; prefix: string; hex: string; full: string };

function parseSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(PII_TOKEN_REGEX)) {
    const matchStart = match.index!;
    if (matchStart > lastIndex) {
      segments.push({ kind: "text", value: text.slice(lastIndex, matchStart) });
    }
    segments.push({
      kind: "token",
      prefix: match[1],
      hex: match[2],
      full: match[0],
    });
    lastIndex = matchStart + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", value: text.slice(lastIndex) });
  }

  return segments;
}

function PiiToken({ prefix, hex }: { prefix: string; hex: string }) {
  const label = PII_LABELS[prefix] ?? "Protected Data";

  return (
    <span
      className="mx-0.5 inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-mono text-[0.85em] leading-tight text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
      title={`${label} (tokenized)`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="h-3 w-3 shrink-0 opacity-60"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Zm-1 3.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
          clipRule="evenodd"
        />
      </svg>
      <span className="opacity-75">{prefix}</span>
      <span>·</span>
      <span>{hex.slice(0, 4)}</span>
    </span>
  );
}

/**
 * Renders text with inline-highlighted PII tokens.
 *
 * PII tokens (e.g. `DOB-211FE712`) are rendered as visually distinct
 * badge-like elements with a lock icon and a tooltip showing the entity
 * type, making it clear to analysts that these are tokenized values —
 * not original case data.
 */
export const PiiHighlightedText = memo(function PiiHighlightedText({
  text,
}: {
  text: string;
}) {
  const segments = useMemo(() => parseSegments(text), [text]);

  if (segments.length === 1 && segments[0].kind === "text") {
    return <>{text}</>;
  }

  return (
    <>
      {segments.map((seg, i) =>
        seg.kind === "text" ? (
          <Fragment key={i}>{seg.value}</Fragment>
        ) : (
          <PiiToken key={i} prefix={seg.prefix} hex={seg.hex} />
        ),
      )}
    </>
  );
});

PiiHighlightedText.displayName = "PiiHighlightedText";

/**
 * Renders pre-formatted text (e.g. JSON) with PII tokens highlighted.
 *
 * Identical to `PiiHighlightedText` but preserves whitespace via a
 * `<span>` with `whitespace-pre-wrap` so it can be placed inside `<pre>`.
 */
export const PiiHighlightedPre = memo(function PiiHighlightedPre({
  text,
}: {
  text: string;
}) {
  const segments = useMemo(() => parseSegments(text), [text]);

  if (segments.length === 1 && segments[0].kind === "text") {
    return <>{text}</>;
  }

  return (
    <span className="whitespace-pre-wrap">
      {segments.map((seg, i) =>
        seg.kind === "text" ? (
          <Fragment key={i}>{seg.value}</Fragment>
        ) : (
          <PiiToken key={i} prefix={seg.prefix} hex={seg.hex} />
        ),
      )}
    </span>
  );
});

PiiHighlightedPre.displayName = "PiiHighlightedPre";

"use client";

import { parseUTCDate } from "@/lib/format";

/**
 * Format options passed through to `Intl.DateTimeFormat`.
 *
 * Defaults to `{ dateStyle: "medium", timeStyle: "short" }` which produces
 * output like "Feb 23, 2026, 2:15 PM" in the user's local timezone.
 */
interface LocalTimeProps {
  /** ISO-8601 date string (typically UTC from the API). */
  value: string | null | undefined;
  /** Fallback text when the value is nullish. @default "—" */
  fallback?: string;
  /** Override `Intl.DateTimeFormat` options. */
  options?: Intl.DateTimeFormatOptions;
}

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

/**
 * Client component that renders a UTC ISO timestamp in the user's browser
 * timezone.
 *
 * Uses `suppressHydrationWarning` because the server formats in UTC while the
 * client formats in the local timezone — the mismatch is intentional.
 *
 * Usage:
 * ```tsx
 * <LocalTime value={scan.created_at} />
 * ```
 */
export function LocalTime({
  value,
  fallback = "—",
  options,
}: LocalTimeProps): React.ReactElement {
  if (!value) {
    return <time>{fallback}</time>;
  }

  let formatted: string;
  try {
    const fmt = new Intl.DateTimeFormat(
      undefined, // browser's locale & timezone
      options ?? DEFAULT_OPTIONS,
    );
    formatted = fmt.format(parseUTCDate(value));
  } catch {
    formatted = value;
  }

  return (
    <time dateTime={value} suppressHydrationWarning>
      {formatted}
    </time>
  );
}

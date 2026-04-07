const COOKIE_NAME = "i4g-engagement-id";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

/** Read the engagement cookie (client-side). */
export function getEngagementCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/** Set the engagement cookie (client-side). */
export function setEngagementCookie(engagementId: string): void {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(engagementId)};path=/;max-age=${MAX_AGE};SameSite=Lax`;
}

/** Clear the engagement cookie (client-side). */
export function clearEngagementCookie(): void {
  document.cookie = `${COOKIE_NAME}=;path=/;max-age=0`;
}

/** Cookie name exported for server-side reads. */
export const ENGAGEMENT_COOKIE_NAME = COOKIE_NAME;

import type { ReactNode } from "react";

/**
 * Legacy /ssi layout — now a transparent passthrough.
 *
 * The SSI tool has moved into the authenticated (console) layout at /ssi.
 * This layout remains only to host the redirect page.
 */
export default function SsiLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

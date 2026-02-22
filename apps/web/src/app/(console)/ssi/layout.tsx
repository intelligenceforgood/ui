import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    template: "%s · Scam Investigator · Intelligence for Good",
    default: "Scam Investigator · Intelligence for Good",
  },
  description:
    "AI-powered scam site investigation, wallet extraction, and evidence packaging.",
};

/**
 * Layout for the SSI section within the authenticated console.
 *
 * This wraps all `/ssi/*` pages with shared context. The outer
 * `(console)` layout already provides the sidebar, auth, and theming.
 */
export default function SsiConsoleLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Scam Site Investigator · Intelligence for Good",
  description:
    "Submit a suspicious URL for AI-powered scam analysis and receive a detailed PDF investigation report.",
  icons: { icon: "/ifg-logomark.svg" },
};

/**
 * Standalone public layout for the Scam Site Investigator tool.
 *
 * This route is intentionally separate from the (console) layout — it renders
 * without the sidebar or IAP authentication so the tool is publicly accessible
 * at /ssi without requiring an analyst account.
 */
export default function SsiLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      {children}
    </div>
  );
}

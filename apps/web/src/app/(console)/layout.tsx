import type { ReactNode } from "react";
import { Navigation } from "./navigation";
import "../globals.css";

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="flex flex-col lg:flex-row">
        <Navigation />
        <main className="flex-1 min-h-screen px-4 py-6 sm:px-10 lg:px-12 lg:py-10">
          <div className="mx-auto w-full max-w-6xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

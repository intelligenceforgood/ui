import type { ReactNode } from "react";
import { AuthProvider, type AuthUser } from "@/lib/auth-context";
import { getCurrentUser } from "@/lib/server/user-service";
import { Navigation } from "./navigation";
import "../globals.css";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const rawUser = await getCurrentUser();
  const user: AuthUser | null = rawUser
    ? {
        email: rawUser.email,
        role: rawUser.role as AuthUser["role"],
        displayName: rawUser.displayName,
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <AuthProvider user={user}>
        <div className="flex flex-col lg:flex-row">
          <Navigation />
          <main className="flex-1 min-h-screen px-4 py-6 sm:px-10 lg:px-12 lg:py-10">
            <div className="mx-auto w-full max-w-6xl space-y-8">{children}</div>
          </main>
        </div>
      </AuthProvider>
    </div>
  );
}

import type { Metadata } from "next";
import { listAccounts } from "@/lib/server/admin-accounts-service";
import { Card, SectionLabel } from "@i4g/ui-kit";
import { Shield, ShieldCheck, ShieldAlert, User } from "lucide-react";

export const metadata: Metadata = {
  title: "User Management",
  description: "View and manage user accounts and roles.",
};

export const dynamic = "force-dynamic";

const roleConfig: Record<
  string,
  { icon: typeof Shield; color: string; label: string }
> = {
  admin: {
    icon: ShieldAlert,
    color: "text-rose-600 bg-rose-50",
    label: "Admin",
  },
  leo: { icon: ShieldCheck, color: "text-amber-600 bg-amber-50", label: "LEO" },
  analyst: {
    icon: Shield,
    color: "text-blue-600 bg-blue-50",
    label: "Analyst",
  },
  user: { icon: User, color: "text-slate-600 bg-slate-100", label: "User" },
};

export default async function AdminUsersPage() {
  let accounts;
  try {
    accounts = await listAccounts(false);
  } catch {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <SectionLabel>Administration</SectionLabel>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
            User Management
          </h1>
        </header>
        <Card className="p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            Unable to load accounts. You may not have admin permissions, or the
            API may be unavailable.
          </p>
        </Card>
      </div>
    );
  }

  const activeAccounts = accounts.filter((a) => a.isActive);
  const inactiveAccounts = accounts.filter((a) => !a.isActive);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <SectionLabel>Administration</SectionLabel>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
          User Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {accounts.length} account{accounts.length !== 1 ? "s" : ""} total (
          {activeAccounts.length} active, {inactiveAccounts.length} inactive)
        </p>
      </header>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">
                Role
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {accounts.map((account) => {
              const rc = roleConfig[account.role] ?? roleConfig.user;
              const RoleIcon = rc.icon;
              return (
                <tr
                  key={account.email}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {account.email}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {account.displayName ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${rc.color}`}
                    >
                      <RoleIcon className="h-3 w-3" />
                      {rc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {account.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                        Inactive
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {accounts.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

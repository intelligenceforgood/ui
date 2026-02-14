import type { Metadata } from "next";
import { listAccounts } from "@/lib/server/admin-accounts-service";
import { Card, SectionLabel } from "@i4g/ui-kit";
import { AccountsTable } from "./accounts-table";

export const metadata: Metadata = {
  title: "User Management",
  description: "View and manage user accounts and roles.",
};

export const dynamic = "force-dynamic";

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

      <AccountsTable accounts={accounts} />
    </div>
  );
}

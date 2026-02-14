"use client";

import { useTransition, useState, useCallback } from "react";
import {
  updateUserRole,
  deactivateAccount,
  reactivateAccount,
  type AccountInfo,
} from "@/lib/server/admin-accounts-service";
import { useAuth } from "@/lib/auth-context";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  MoreVertical,
  UserX,
  UserCheck,
} from "lucide-react";

const ROLES = ["user", "analyst", "leo", "admin"] as const;

const roleConfig: Record<
  string,
  { icon: typeof Shield; color: string; label: string }
> = {
  admin: {
    icon: ShieldAlert,
    color: "text-rose-600 bg-rose-50",
    label: "Admin",
  },
  leo: {
    icon: ShieldCheck,
    color: "text-amber-600 bg-amber-50",
    label: "LEO",
  },
  analyst: {
    icon: Shield,
    color: "text-blue-600 bg-blue-50",
    label: "Analyst",
  },
  user: { icon: User, color: "text-slate-600 bg-slate-100", label: "User" },
};

interface AccountsTableProps {
  accounts: AccountInfo[];
}

export function AccountsTable({ accounts: initial }: AccountsTableProps) {
  const { user: currentUser } = useAuth();
  const [accounts, setAccounts] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    email: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showFeedback = useCallback(
    (email: string, message: string, type: "success" | "error") => {
      setFeedback({ email, message, type });
      setTimeout(() => setFeedback(null), 3000);
    },
    [],
  );

  const isSelf = (email: string) => email === currentUser?.email;

  const handleRoleChange = (email: string, newRole: string) => {
    if (isSelf(email)) return;
    startTransition(async () => {
      try {
        const result = await updateUserRole(email, newRole);
        if (result.updated) {
          setAccounts((prev) =>
            prev.map((a) =>
              a.email === email ? { ...a, role: result.newRole } : a,
            ),
          );
          showFeedback(
            email,
            `Role changed to ${roleConfig[newRole]?.label ?? newRole}`,
            "success",
          );
        }
      } catch {
        showFeedback(email, "Failed to update role", "error");
      }
    });
  };

  const handleDeactivate = (email: string) => {
    if (isSelf(email)) return;
    setActionMenu(null);
    startTransition(async () => {
      try {
        const result = await deactivateAccount(email);
        if (result.deactivated) {
          setAccounts((prev) =>
            prev.map((a) =>
              a.email === email ? { ...a, isActive: false } : a,
            ),
          );
          showFeedback(email, "Account deactivated", "success");
        }
      } catch {
        showFeedback(email, "Failed to deactivate account", "error");
      }
    });
  };

  const handleReactivate = (email: string) => {
    setActionMenu(null);
    startTransition(async () => {
      try {
        const result = await reactivateAccount(email);
        if (result.reactivated) {
          setAccounts((prev) =>
            prev.map((a) => (a.email === email ? { ...a, isActive: true } : a)),
          );
          showFeedback(email, "Account reactivated", "success");
        }
      } catch {
        showFeedback(email, "Failed to reactivate account", "error");
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {isPending && (
        <div className="border-b border-sky-200 bg-sky-50 px-4 py-2 text-xs text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300">
          Saving changes…
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
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
            <th className="w-12 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {accounts.map((account) => {
            const rc = roleConfig[account.role] ?? roleConfig.user;
            const RoleIcon = rc.icon;
            const self = isSelf(account.email);
            const feedbackItem =
              feedback?.email === account.email ? feedback : null;

            return (
              <tr
                key={account.email}
                className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    {account.email}
                    {self && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-600">
                        you
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {account.displayName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {self ? (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${rc.color}`}
                    >
                      <RoleIcon className="h-3 w-3" />
                      {rc.label}
                    </span>
                  ) : (
                    <select
                      value={account.role}
                      disabled={isPending}
                      onChange={(e) =>
                        handleRoleChange(account.email, e.target.value)
                      }
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {roleConfig[r].label}
                        </option>
                      ))}
                    </select>
                  )}
                  {feedbackItem && (
                    <span
                      className={`ml-2 text-xs ${feedbackItem.type === "success" ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {feedbackItem.message}
                    </span>
                  )}
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
                <td className="relative px-4 py-3">
                  {!self && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActionMenu(
                            actionMenu === account.email ? null : account.email,
                          )
                        }
                        className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                        aria-label={`Actions for ${account.email}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {actionMenu === account.email && (
                        <div className="absolute right-0 z-10 mt-1 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                          {account.isActive ? (
                            <button
                              type="button"
                              onClick={() => handleDeactivate(account.email)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950"
                            >
                              <UserX className="h-4 w-4" />
                              Deactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReactivate(account.email)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-emerald-600 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950"
                            >
                              <UserCheck className="h-4 w-4" />
                              Reactivate
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {accounts.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                No accounts found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { useTransition, useState, useCallback, useEffect } from "react";
import {
  updateUserRole,
  deactivateAccount,
  reactivateAccount,
  type AccountInfo,
} from "@/lib/server/admin-accounts-service";
import {
  adminListApiKeys,
  adminRevokeApiKey,
  type ApiKeyInfo,
} from "@/lib/api/api-keys";
import { useAuth } from "@/lib/auth-context";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  MoreVertical,
  UserX,
  UserCheck,
  Key,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@i4g/ui-kit";
import { CreatePartnerKeyModal } from "./create-partner-key-modal";

const ROLES = ["user", "analyst", "manager", "leo", "admin"] as const;

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
  manager: {
    icon: ShieldCheck,
    color: "text-purple-600 bg-purple-50",
    label: "Manager",
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
  const { user: currentUser, hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const [accounts, setAccounts] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  // Admin API key management state
  const [allKeys, setAllKeys] = useState<ApiKeyInfo[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [partnerTargetEmail, setPartnerTargetEmail] = useState<string>("");

  const [feedback, setFeedback] = useState<{
    email: string;
    message: string;
    type: "success" | "error";
  } | null>(null);

  const loadAllKeys = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingKeys(true);
    try {
      const res = await adminListApiKeys();
      setAllKeys(res.keys || []);
    } catch (err) {
      console.error("Failed to load admin API keys:", err);
    } finally {
      setLoadingKeys(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadAllKeys();
  }, [loadAllKeys]);

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

  const handleAdminRevokeKey = async (keyId: string, email: string) => {
    try {
      await adminRevokeApiKey(keyId);
      setAllKeys((prev) =>
        prev.map((k) => (k.keyId === keyId ? { ...k, isActive: false } : k)),
      );
      showFeedback(email, "API key revoked", "success");
    } catch {
      showFeedback(email, "Failed to revoke API key", "error");
    }
  };

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <Key className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="font-semibold">Admin API Key Controls:</span>
            <span className="text-slate-500 dark:text-slate-400">
              {allKeys.length} total API keys registered (
              {allKeys.filter((k) => k.isActive).length} active)
            </span>
          </div>
          <Button
            type="button"
            className="flex items-center gap-1.5 text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => {
              setPartnerTargetEmail("");
              setPartnerModalOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Provision Partner Key
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
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
              {isAdmin && (
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">
                  API Keys
                </th>
              )}
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {accounts.map((account, index) => {
              const rc = roleConfig[account.role] ?? roleConfig.user;
              const RoleIcon = rc.icon;
              const self = isSelf(account.email);
              const openUp = index >= accounts.length - 2;
              const feedbackItem =
                feedback?.email === account.email ? feedback : null;

              const userKeys = allKeys.filter(
                (k) =>
                  (k.ownerEmail &&
                    k.ownerEmail.toLowerCase() ===
                      account.email.toLowerCase()) ||
                  (k.partnerName &&
                    k.partnerName.toLowerCase() ===
                      account.email.toLowerCase()) ||
                  (k.partnerName &&
                    account.displayName &&
                    k.partnerName.toLowerCase() ===
                      account.displayName.toLowerCase()),
              );
              const activeUserKeysCount = userKeys.filter(
                (k) => k.isActive,
              ).length;
              const isExpanded = expandedUser === account.email;

              return (
                <FragmentWrapper key={account.email}>
                  <tr className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
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
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-sky-400 focus:outline-hidden focus:ring-1 focus:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
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

                    {isAdmin && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedUser(isExpanded ? null : account.email)
                          }
                          className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                        >
                          <Key className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {userKeys.length} key
                            {userKeys.length !== 1 ? "s" : ""} (
                            {activeUserKeysCount} active)
                          </span>
                          {userKeys.length > 0 &&
                            (isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            ))}
                        </button>
                      </td>
                    )}

                    <td className="relative px-4 py-3">
                      {!self && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActionMenu(
                                actionMenu === account.email
                                  ? null
                                  : account.email,
                              )
                            }
                            className="rounded-sm p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                            aria-label={`Actions for ${account.email}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {actionMenu === account.email && (
                            <div
                              className={`absolute right-0 z-10 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800 ${openUp ? "bottom-full mb-1" : "mt-1"}`}
                            >
                              {account.isActive ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeactivate(account.email)
                                  }
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950"
                                >
                                  <UserX className="h-4 w-4" />
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleReactivate(account.email)
                                  }
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-emerald-600 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  Reactivate
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenu(null);
                                  setPartnerTargetEmail(account.email);
                                  setPartnerModalOpen(true);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-purple-600 transition-colors hover:bg-purple-50 dark:hover:bg-purple-950"
                              >
                                <Key className="h-4 w-4" />
                                Provision Key
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Expandable API keys drawer for row */}
                  {isAdmin && isExpanded && (
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <span>API Keys for {account.email}</span>
                            <Button
                              type="button"
                              variant="secondary"
                              className="h-6 px-2 text-[11px]"
                              onClick={() => {
                                setPartnerTargetEmail(account.email);
                                setPartnerModalOpen(true);
                              }}
                            >
                              + Provision Key
                            </Button>
                          </div>

                          {userKeys.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">
                              No API keys issued for this user.
                            </p>
                          ) : (
                            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden text-xs">
                              <table className="w-full text-left">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                  <tr>
                                    <th className="p-2">Prefix</th>
                                    <th className="p-2">Type</th>
                                    <th className="p-2">Description</th>
                                    <th className="p-2">Status</th>
                                    <th className="p-2">Created</th>
                                    <th className="p-2">Last Used</th>
                                    <th className="p-2 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                  {userKeys.map((k) => (
                                    <tr key={k.keyId}>
                                      <td className="p-2 font-mono">
                                        {k.keyPrefix}...
                                      </td>
                                      <td className="p-2 capitalize">
                                        {k.keyType}
                                      </td>
                                      <td className="p-2">
                                        {k.description || "—"}
                                      </td>
                                      <td className="p-2">
                                        {k.isActive ? (
                                          <span className="text-emerald-600 font-medium">
                                            Active
                                          </span>
                                        ) : (
                                          <span className="text-slate-400">
                                            Revoked
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-2 text-slate-500">
                                        {new Date(
                                          k.createdAt,
                                        ).toLocaleDateString()}
                                      </td>
                                      <td className="p-2 text-slate-500">
                                        {k.lastUsedAt
                                          ? new Date(
                                              k.lastUsedAt,
                                            ).toLocaleDateString()
                                          : "Never"}
                                      </td>
                                      <td className="p-2 text-right">
                                        {k.isActive && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleAdminRevokeKey(
                                                k.keyId,
                                                account.email,
                                              )
                                            }
                                            className="text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1"
                                          >
                                            <Trash2 className="h-3 w-3" />{" "}
                                            Revoke
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </FragmentWrapper>
              );
            })}
            {accounts.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CreatePartnerKeyModal
        isOpen={partnerModalOpen}
        initialOwnerEmail={partnerTargetEmail}
        onClose={() => setPartnerModalOpen(false)}
        onSuccess={loadAllKeys}
      />
    </div>
  );
}

function FragmentWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import {
  Key,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Button, Card, Badge, SectionLabel, FeedbackButton } from "@i4g/ui-kit";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { listApiKeys, revokeApiKey, type ApiKeyInfo } from "@/lib/api/api-keys";
import { CreateKeyModal } from "./create-key-modal";

export default function ApiKeysSettingsPage() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listApiKeys();
      setKeys(res.keys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API keys.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleRevoke = (keyId: string) => {
    setRevokingId(keyId);
    startTransition(async () => {
      try {
        await revokeApiKey(keyId);
        setKeys((prev) =>
          prev.map((k) => (k.keyId === keyId ? { ...k, isActive: false } : k)),
        );
        setConfirmRevokeId(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to revoke API key.",
        );
      } finally {
        setRevokingId(null);
      }
    });
  };

  const getStatusBadge = (key: ApiKeyInfo) => {
    if (!key.isActive) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          <ShieldAlert className="h-3 w-3" /> Revoked
        </span>
      );
    }
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          <Clock className="h-3 w-3" /> Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
        <ShieldCheck className="h-3 w-3" /> Active
      </span>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="group relative space-y-6">
      <FeedbackButton
        feedbackId="settings.api-keys"
        className="absolute top-1 right-0 z-10"
      />

      <Breadcrumbs
        items={[
          { label: "Settings", href: "/settings/api-keys" },
          { label: "API Keys" },
        ]}
      />

      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <SectionLabel>Account Settings</SectionLabel>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Key className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            API Keys
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your personal API keys for programmatic access to the I4G
            API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={fetchKeys}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Create New Key
          </Button>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 p-4 text-sm text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl">
        {loading && keys.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading API keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500">
              <Key className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-medium text-slate-900 dark:text-white">
                No API Keys Found
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                You haven&apos;t generated any API keys yet. Create one to
                enable custom scripts and programmatic API integrations.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Create Your First API Key
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Key Prefix</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5">Expires</th>
                  <th className="px-6 py-3.5">Last Used</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {keys.map((key) => (
                  <tr
                    key={key.keyId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-slate-900 dark:text-white font-medium">
                      {key.keyPrefix}...
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {key.description || "No description"}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(key)}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(key.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(key.expiresAt)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {key.lastUsedAt ? formatDate(key.lastUsedAt) : "Never"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {key.isActive && (
                        <>
                          {confirmRevokeId === key.keyId ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-rose-600 font-medium">
                                Confirm?
                              </span>
                              <Button
                                type="button"
                                variant="secondary"
                                className="h-7 px-2.5 text-xs"
                                onClick={() => setConfirmRevokeId(null)}
                                disabled={revokingId === key.keyId}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                className="h-7 px-2.5 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                                onClick={() => handleRevoke(key.keyId)}
                                disabled={revokingId === key.keyId}
                              >
                                {revokingId === key.keyId
                                  ? "Revoking..."
                                  : "Revoke"}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="secondary"
                              className="h-8 px-3 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5 ml-auto"
                              onClick={() => setConfirmRevokeId(key.keyId)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Revoke
                            </Button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreateKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchKeys}
      />
    </div>
  );
}

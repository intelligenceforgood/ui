"use client";

import { useState, useTransition } from "react";
import { Key, Copy, Check, AlertTriangle, X, ShieldAlert } from "lucide-react";
import { Button, Input } from "@i4g/ui-kit";
import { createApiKey, type CreateApiKeyResponse } from "@/lib/api/api-keys";

interface CreateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EXPIRY_OPTIONS = [
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "1 year (365 days)", value: 365 },
  { label: "Never expire (Perpetual)", value: null },
  { label: "Custom days...", value: "custom" },
] as const;

export function CreateKeyModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateKeyModalProps) {
  const [description, setDescription] = useState("");
  const [expirySelection, setExpirySelection] = useState<
    number | null | "custom"
  >(90);
  const [customDays, setCustomDays] = useState("30");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Key creation result state (one-time display)
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    let expiresInDays: number | null = null;
    if (expirySelection === "custom") {
      const parsed = parseInt(customDays, 10);
      if (isNaN(parsed) || parsed <= 0) {
        setError("Custom expiration days must be a positive integer.");
        return;
      }
      expiresInDays = parsed;
    } else if (typeof expirySelection === "number") {
      expiresInDays = expirySelection;
    }

    setError(null);
    startTransition(async () => {
      try {
        const result = await createApiKey({
          description: description.trim(),
          expiresInDays,
        });
        setCreatedKey(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create API key. Please try again.",
        );
      }
    });
  };

  const handleCopy = async () => {
    if (!createdKey?.rawKey) return;
    try {
      await navigator.clipboard.writeText(createdKey.rawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = createdKey.rawKey;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDone = () => {
    setCreatedKey(null);
    setDescription("");
    setExpirySelection(90);
    setCopied(false);
    setAcknowledged(false);
    onSuccess();
    onClose();
  };

  const handleDismissAttempt = () => {
    // If key has been generated, do not allow closing without explicit acknowledgement
    if (createdKey) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        {!createdKey && (
          <button
            type="button"
            onClick={handleDismissAttempt}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {createdKey ? "Save Your API Key" : "Create New API Key"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {createdKey
                ? "Your API key has been created. Copy it now."
                : "Generate a programmatic access key for external integration."}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 p-3 text-sm text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* State 1: Key Creation Form */}
        {!createdKey ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="key-description"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Key Description <span className="text-rose-500">*</span>
              </label>
              <Input
                id="key-description"
                placeholder="e.g. CI/CD Ingestion Worker, CLI Tooling"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div>
              <label
                htmlFor="key-expiry"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Expiration
              </label>
              <select
                id="key-expiry"
                value={
                  expirySelection === "custom"
                    ? "custom"
                    : expirySelection === null
                      ? "null"
                      : String(expirySelection)
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "custom") {
                    setExpirySelection("custom");
                  } else if (val === "null") {
                    setExpirySelection(null);
                  } else {
                    setExpirySelection(Number(val));
                  }
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {EXPIRY_OPTIONS.map((opt) => (
                  <option
                    key={String(opt.value)}
                    value={opt.value === null ? "null" : String(opt.value)}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>

              {expirySelection === "custom" && (
                <div className="mt-3">
                  <label
                    htmlFor="custom-days"
                    className="block text-xs text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Custom days until expiration
                  </label>
                  <Input
                    id="custom-days"
                    type="number"
                    min="1"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Generating Key..." : "Generate Key"}
              </Button>
            </div>
          </form>
        ) : (
          /* State 2: One-Time Key Display */
          <div className="space-y-5">
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-4 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong className="font-semibold block text-sm mb-0.5">
                  Important: Store this key securely
                </strong>
                This API key will <strong>only be shown once</strong>. You will
                not be able to see it again after closing this window.
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Your Secret API Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdKey.rawKey}
                  className="w-full font-mono text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none select-all"
                />
                <Button
                  type="button"
                  variant={copied ? "secondary" : "primary"}
                  onClick={handleCopy}
                  className="shrink-0 flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="ack-copied"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="ack-copied"
                className="text-xs text-slate-600 dark:text-slate-300 select-none cursor-pointer"
              >
                I have saved/copied this key in a secure location
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={handleDone}
                disabled={!acknowledged}
                className="w-full sm:w-auto"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

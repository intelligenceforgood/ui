"use client";

import { useState, useTransition, useEffect } from "react";
import { Key, Copy, Check, AlertTriangle, X, ShieldAlert } from "lucide-react";
import { Button, Input } from "@i4g/ui-kit";
import {
  createPartnerKey,
  type CreateApiKeyResponse,
} from "@/lib/api/api-keys";

interface CreatePartnerKeyModalProps {
  isOpen: boolean;
  initialOwnerEmail?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePartnerKeyModal({
  isOpen,
  initialOwnerEmail = "",
  onClose,
  onSuccess,
}: CreatePartnerKeyModalProps) {
  const [partnerName, setPartnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState(initialOwnerEmail);
  const [description, setDescription] = useState("");
  const [rateLimit, setRateLimit] = useState("60");
  const [expiryDays, setExpiryDays] = useState("365");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOwnerEmail(initialOwnerEmail);
      if (initialOwnerEmail && !partnerName) {
        setPartnerName(initialOwnerEmail);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialOwnerEmail]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) {
      setError("Partner organization name is required.");
      return;
    }

    const rateLimitNum = parseInt(rateLimit, 10);
    if (isNaN(rateLimitNum) || rateLimitNum <= 0) {
      setError("Rate limit must be a positive integer.");
      return;
    }

    const expiryNum = expiryDays ? parseInt(expiryDays, 10) : null;
    if (
      expiryDays &&
      (isNaN(Number(expiryNum)) || (expiryNum !== null && expiryNum <= 0))
    ) {
      setError("Expiry days must be positive if specified.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const result = await createPartnerKey({
          partnerName: partnerName.trim(),
          ownerEmail: ownerEmail.trim() || undefined,
          description: description.trim() || undefined,
          rateLimitPerMinute: rateLimitNum,
          expiresInDays: expiryNum,
        });
        setCreatedKey(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create partner API key.",
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
    setPartnerName("");
    setDescription("");
    setCopied(false);
    setAcknowledged(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        {!createdKey && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {createdKey
                ? "Partner API Key Provisioned"
                : "Provision Partner API Key"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Admin provisioned key for external partner integration.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 p-3 text-sm text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!createdKey ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Partner Name <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="e.g. Acme Intelligence Feed"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Owner Email
              </label>
              <Input
                placeholder="e.g. partner-contact@acme.org"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Rate Limit (req/min)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Expiration (Days)
                </label>
                <Input
                  type="number"
                  placeholder="365 (blank for perpetual)"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <Input
                placeholder="Optional notes or partner contact details"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full"
              />
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
                {isPending ? "Provisioning..." : "Provision Partner Key"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-4 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong className="font-semibold block text-sm mb-0.5">
                  One-time Display Key
                </strong>
                Copy this partner key now. It will not be shown again once
                closed.
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Partner API Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdKey.rawKey}
                  className="w-full font-mono text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 select-all"
                />
                <Button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 flex items-center gap-1.5"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="partner-ack"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="partner-ack"
                className="text-xs text-slate-600 dark:text-slate-300 select-none cursor-pointer"
              >
                I have securely transmitted or stored this partner key
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

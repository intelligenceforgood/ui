"use client";

import { useCallback, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { clsx } from "clsx";
import { AlertTriangle, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Badge, Button } from "@i4g/ui-kit";

interface DedupWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  url: string;
  existingScanId: string;
  existingRiskScore: number | null;
  daysSinceScan: number;
  onViewExisting: (scanId: string) => void;
  onReinvestigateSuccess: (response: Record<string, unknown>) => void;
}

/**
 * Modal shown when a user tries to investigate a URL that was recently investigated.
 * Shows existing result summary and offers "View Existing" or "Re-investigate" actions.
 */
export function DedupWarningModal({
  isOpen,
  onClose,
  caseId,
  url,
  existingScanId,
  existingRiskScore,
  daysSinceScan,
  onViewExisting,
  onReinvestigateSuccess,
}: DedupWarningModalProps) {
  const [reinvestigating, setReinvestigating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReinvestigate = useCallback(async () => {
    setReinvestigating(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/investigate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, force: true }),
      });
      if (!res.ok) throw new Error(`Re-investigate failed: ${res.status}`);
      const response = await res.json();
      onReinvestigateSuccess(response);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to trigger investigation",
      );
    } finally {
      setReinvestigating(false);
    }
  }, [caseId, url, onReinvestigateSuccess, onClose]);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={() => onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={clsx(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          )}
          aria-describedby="dedup-description"
        >
          <DialogPrimitive.Title className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <AlertTriangle
              className="h-5 w-5 text-amber-500"
              aria-hidden="true"
            />
            URL Already Investigated
          </DialogPrimitive.Title>

          <div id="dedup-description" className="mt-3 space-y-3">
            <p className="text-sm text-slate-600">
              This URL was investigated{" "}
              <span className="font-medium">
                {daysSinceScan === 0
                  ? "today"
                  : daysSinceScan === 1
                    ? "yesterday"
                    : `${daysSinceScan} days ago`}
              </span>
              .
            </p>

            <div className="rounded-lg bg-slate-50 p-3">
              <p
                className="truncate text-sm font-medium text-slate-700"
                title={url}
              >
                {url}
              </p>
              {existingRiskScore != null && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500">Risk Score:</span>
                  <Badge
                    variant={
                      existingRiskScore >= 75
                        ? "danger"
                        : existingRiskScore >= 40
                          ? "warning"
                          : "success"
                    }
                  >
                    {existingRiskScore.toFixed(1)}
                  </Badge>
                </div>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>

          <div className="mt-5 flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onViewExisting(existingScanId);
                onClose();
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              View Existing Result
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={reinvestigating}
              onClick={handleReinvestigate}
            >
              {reinvestigating ? (
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Re-investigate Anyway
            </Button>
          </div>

          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label="Close"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

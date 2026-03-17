"use client";

import { useCallback, useState } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@i4g/ui-kit";

interface InvestigateButtonProps {
  caseId: string;
  url: string;
  variant: "investigate" | "reinvestigate" | "retry";
  onSuccess: (response: Record<string, unknown>) => void;
  onDedupDetected: (response: Record<string, unknown>) => void;
  onError: (error: Error) => void;
}

const variantConfig = {
  investigate: {
    label: "Investigate",
    icon: Search,
    force: false,
    buttonVariant: "secondary" as const,
  },
  reinvestigate: {
    label: "Re-investigate",
    icon: RefreshCw,
    force: true,
    buttonVariant: "ghost" as const,
  },
  retry: {
    label: "Retry",
    icon: RefreshCw,
    force: false,
    buttonVariant: "ghost" as const,
  },
};

/**
 * Button that triggers SSI investigation for a URL on a case.
 * Handles loading state and error feedback.
 */
export function InvestigateButton({
  caseId,
  url,
  variant,
  onSuccess,
  onDedupDetected,
  onError,
}: InvestigateButtonProps) {
  const [loading, setLoading] = useState(false);
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/investigate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, force: config.force }),
      });
      if (!res.ok) throw new Error(`Investigate failed: ${res.status}`);
      const response = await res.json();

      // Check if dedup was detected (not triggered, already investigated)
      if (
        response.alreadyInvestigated === true &&
        response.triggered === false
      ) {
        onDedupDetected(response);
      } else {
        onSuccess(response);
      }
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [caseId, url, config.force, onSuccess, onDedupDetected, onError]);

  return (
    <Button
      variant={config.buttonVariant}
      size="sm"
      disabled={loading}
      onClick={handleClick}
      aria-label={`${config.label} ${url}`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {config.label}
    </Button>
  );
}

"use client";

import { useState } from "react";
import { EyeOff, Loader2, Lock } from "lucide-react";
import { detokenizeAction } from "@/actions/tokenization";
import { Button } from "@i4g/ui-kit";
import { PII_LABELS } from "@/lib/pii-labels";

interface TokenRevealProps {
  token: string;
  caseId?: string;
  className?: string;
}

export function TokenReveal({ token, caseId, className }: TokenRevealProps) {
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleReveal = async () => {
    if (revealedValue) {
      setIsOpen(!isOpen);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const value = await detokenizeAction(token, caseId);
      setRevealedValue(value);
      setIsOpen(true);
    } catch (err) {
      console.error("Failed to detokenize:", err);
      setError("Failed to reveal");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token.match(/^[A-Z]{3}-[0-9A-F]{8}$/)) {
    return <span className={className}>{token}</span>;
  }

  const prefix = token.slice(0, 3);
  const hex = token.slice(4);
  const piiLabel = PII_LABELS[prefix] ?? "Protected Data";

  return (
    <span
      className={`mx-0.5 inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 py-0.5 pl-1.5 pr-0.5 font-mono text-[0.85em] leading-tight text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300 ${className ?? ""}`}
      title={`${piiLabel} (tokenized)`}
    >
      <span className="relative group">
        {isOpen ? (
          <span className="rounded bg-green-100 px-1 py-0.5 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            {revealedValue}
          </span>
        ) : (
          <>
            <span className="opacity-75">{prefix}</span>
            <span className="mx-0.5">·</span>
            <span>{hex.slice(0, 4)}</span>
          </>
        )}
        {error && (
          <span className="absolute -bottom-5 left-0 text-[10px] text-red-500 whitespace-nowrap">
            {error}
          </span>
        )}
      </span>

      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/40"
        onClick={handleReveal}
        disabled={isLoading}
        title={isOpen ? "Hide value" : `Reveal ${piiLabel}`}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin text-amber-500/70" />
        ) : isOpen ? (
          <EyeOff className="h-3 w-3 text-amber-600/70 hover:text-amber-700 dark:hover:text-amber-400" />
        ) : (
          <Lock className="h-3 w-3 text-amber-500/70 hover:text-amber-600" />
        )}
        <span className="sr-only">
          {isOpen ? "Hide value" : `Reveal ${piiLabel}`}
        </span>
      </Button>
    </span>
  );
}

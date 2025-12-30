"use client";

import { useState } from "react";
import { EyeOff, Loader2, Lock } from "lucide-react";
import { detokenizeAction } from "@/actions/tokenization";
import { Button } from "@i4g/ui-kit";

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

  const containerClass = `inline-flex items-center gap-1.5 ${className || ""}`;
  const codeClass = `px-1.5 py-0.5 rounded text-xs font-mono transition-colors ${
    isOpen
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
  }`;

  return (
    <span className={containerClass}>
      <span className="relative group">
        <code className={codeClass}>{isOpen ? revealedValue : token}</code>
        {error && (
          <span className="absolute -bottom-5 left-0 text-[10px] text-red-500 whitespace-nowrap">
            {error}
          </span>
        )}
      </span>

      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
        onClick={handleReveal}
        disabled={isLoading}
        title={isOpen ? "Hide value" : "Reveal original value"}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
        ) : isOpen ? (
          <EyeOff className="h-3 w-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
        ) : (
          <Lock className="h-3 w-3 text-amber-500/70 hover:text-amber-600" />
        )}
        <span className="sr-only">{isOpen ? "Hide value" : "Reveal PII"}</span>
      </Button>
    </span>
  );
}

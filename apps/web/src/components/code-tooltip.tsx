"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

interface CodeTooltipProps {
  /** The internal code to show on hover (e.g. "INTENT.INVESTMENT"). */
  code: string;
  /** The visible content (display label). */
  children: ReactNode;
  /** Tooltip placement. */
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * Wraps inline text so hovering reveals the internal taxonomy code
 * in a styled tooltip popup. Uses Radix UI for accessibility.
 */
export function CodeTooltip({
  code,
  children,
  side = "top",
}: CodeTooltipProps) {
  if (!code) return <>{children}</>;

  return (
    <TooltipPrimitive.Provider delayDuration={150}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <span className="cursor-default border-b border-dashed border-slate-300 dark:border-slate-600">
            {children}
          </span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={4}
            className="z-50 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-mono text-white shadow-md animate-in fade-in-0 zoom-in-95 dark:bg-slate-700"
          >
            {code}
            <TooltipPrimitive.Arrow className="fill-slate-800 dark:fill-slate-700" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

import { clsx } from "clsx";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

export interface HelpTooltipProps {
  /** Short title rendered bold above the body text. */
  title?: string;
  /** Tooltip body — plain text or short markdown-style content. */
  content: string;
  /** The inline trigger element (defaults to a circled question-mark icon). */
  children?: ReactNode;
  /** Side of the trigger to show the tooltip. */
  side?: "top" | "right" | "bottom" | "left";
  /** Additional class names on the trigger wrapper. */
  className?: string;
  /** Accessible label for the trigger when using the default icon. */
  "aria-label"?: string;
}

/**
 * Inline contextual-help tooltip.
 *
 * Shows a small informational popup on hover/focus. Designed for field-level
 * help in forms, table headers, and section titles.
 *
 * Uses Radix UI Tooltip primitives for accessibility (keyboard-navigable,
 * proper ARIA attributes, dismissible with Escape).
 */
export function HelpTooltip({
  title,
  content,
  children,
  side = "top",
  className,
  "aria-label": ariaLabel = "Show help",
}: HelpTooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <button
            type="button"
            className={clsx(
              "inline-flex items-center justify-center rounded-full text-slate-400 hover:text-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 transition",
              className,
            )}
            aria-label={ariaLabel}
          >
            {children ?? <DefaultHelpIcon />}
          </button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className="z-50 max-w-xs rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-lg animate-in fade-in-0 zoom-in-95 dark:border-slate-700 dark:bg-slate-900"
          >
            {title ? (
              <p className="mb-1 font-semibold text-slate-900 dark:text-white">
                {title}
              </p>
            ) : null}
            <p className="text-slate-600 leading-relaxed dark:text-slate-300">
              {content}
            </p>
            <TooltipPrimitive.Arrow className="fill-white dark:fill-slate-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

function DefaultHelpIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <text
        x="8"
        y="12"
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        fill="currentColor"
      >
        ?
      </text>
    </svg>
  );
}

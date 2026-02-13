import { clsx } from "clsx";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ReactNode } from "react";

export interface InfoPopoverProps {
  /** Popover heading. */
  title: string;
  /** Body content — can be richer markdown-style text. */
  content: string;
  /** Optional link to external documentation. */
  docUrl?: string;
  /** Label for the doc link (defaults to "Learn more"). */
  docLabel?: string;
  /** Trigger element (defaults to an info-circle icon). */
  children?: ReactNode;
  /** Side of the trigger to show the popover. */
  side?: "top" | "right" | "bottom" | "left";
  /** Additional class names on the trigger wrapper. */
  className?: string;
  /** Accessible label for the trigger. */
  "aria-label"?: string;
}

/**
 * Rich contextual-help popover.
 *
 * Shows a larger panel with a title, body, and optional doc link. Click to
 * open/close (or keyboard-activate). Suitable for workflow explanations,
 * definition cards, and multi-paragraph help content.
 *
 * Uses Radix UI Popover primitives for accessibility (focus trap, Escape to
 * close, pointer-down-outside to dismiss).
 */
export function InfoPopover({
  title,
  content,
  docUrl,
  docLabel = "Learn more",
  children,
  side = "bottom",
  className,
  "aria-label": ariaLabel = "More info",
}: InfoPopoverProps) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={clsx(
            "inline-flex items-center justify-center rounded-full text-slate-400 hover:text-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 transition",
            className,
          )}
          aria-label={ariaLabel}
        >
          {children ?? <DefaultInfoIcon />}
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side={side}
          sideOffset={8}
          align="start"
          className="z-50 w-80 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl animate-in fade-in-0 zoom-in-95 dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                {title}
              </h4>
              <PopoverPrimitive.Close
                className="rounded-full p-1 text-slate-400 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                >
                  <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </PopoverPrimitive.Close>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed dark:text-slate-300">
              {content}
            </p>
            {docUrl ? (
              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400"
              >
                {docLabel}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-3 w-3"
                >
                  <path d="M8.22 2.97a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06l2.97-2.97H3.75a.75.75 0 0 1 0-1.5h7.44L8.22 4.03a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </a>
            ) : null}
          </div>
          <PopoverPrimitive.Arrow className="fill-white dark:fill-slate-900" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function DefaultInfoIcon() {
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
        fontWeight="700"
        fill="currentColor"
      >
        i
      </text>
    </svg>
  );
}

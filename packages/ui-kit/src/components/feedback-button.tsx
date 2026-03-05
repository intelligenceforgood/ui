"use client";

import { clsx } from "clsx";
import { useCallback, useState, type ComponentPropsWithoutRef } from "react";
import { useFeedback } from "./feedback-provider";

export interface FeedbackButtonProps
  extends Omit<ComponentPropsWithoutRef<"button">, "onClick"> {
  /**
   * Two-level feedback identifier: `page.section`.
   * Determines which Google Sheet tab and section column to write to.
   *
   * @example "dashboard.metrics"
   */
  feedbackId: string;
  /**
   * Visual variant.
   * - `"icon"` — small speech-bubble icon (default), shown on hover.
   * - `"text"` — subtle text link saying "Feedback".
   */
  variant?: "icon" | "text";
}

/* -------------------------------------------------------------------------- */
/*  Inline SVG so we don't depend on lucide-react at the ui-kit level.        */
/* -------------------------------------------------------------------------- */

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="9" y1="10" x2="15" y2="10" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Inline feedback button.
 *
 * Appears as a subtle icon in the corner of a section. Clicking it opens the
 * shared `FeedbackDialog` with the section's `feedbackId` pre-filled.
 *
 * The icon variant is invisible by default and becomes visible when the
 * parent container is hovered (add `group` to the container). On mobile the
 * button is always visible since hover isn't available.
 */
export function FeedbackButton({
  feedbackId,
  variant = "icon",
  className,
  ...rest
}: FeedbackButtonProps) {
  const { openFeedback, enabled } = useFeedback();
  const [showCheck, setShowCheck] = useState(false);

  const handleClick = useCallback(() => {
    openFeedback(feedbackId);
  }, [feedbackId, openFeedback]);

  /** Called by the dialog on successful submit to flash a green check. */
  // We expose this via a data attribute for the dialog to find
  if (!enabled) return null;

  if (variant === "text") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={clsx(
          "inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-500 transition-colors",
          className,
        )}
        aria-label={`Send feedback about ${feedbackId}`}
        data-feedback-id={feedbackId}
        {...rest}
      >
        <MessageIcon className="w-3.5 h-3.5" />
        <span>Feedback</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        "inline-flex items-center justify-center w-7 h-7 rounded-full",
        "text-slate-400 hover:text-teal-500 hover:bg-slate-100",
        "opacity-0 group-hover:opacity-100 focus:opacity-100",
        "sm:opacity-0 max-sm:opacity-60",
        "transition-all duration-200",
        showCheck && "!text-emerald-500 !opacity-100",
        className,
      )}
      aria-label={`Send feedback about ${feedbackId}`}
      data-feedback-id={feedbackId}
      {...rest}
    >
      {showCheck ? (
        <CheckIcon className="w-4 h-4" />
      ) : (
        <MessageIcon className="w-4 h-4" />
      )}
    </button>
  );
}

/**
 * Trigger the success animation on a feedback button after submission.
 *
 * @param feedbackId - The ID to find the button for.
 */
export function flashFeedbackSuccess(feedbackId: string): void {
  // This is handled at the app level — the FeedbackDialog manages
  // the animation state by finding the button via data-feedback-id.
  const btn = document.querySelector(
    `[data-feedback-id="${feedbackId}"]`,
  ) as HTMLElement | null;
  if (!btn) return;

  btn.classList.add("!text-emerald-500", "!opacity-100");
  setTimeout(() => {
    btn.classList.remove("!text-emerald-500", "!opacity-100");
  }, 2000);
}

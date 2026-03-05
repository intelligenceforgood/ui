"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { clsx } from "clsx";
import { useCallback, useState, type FormEvent } from "react";
import { flashFeedbackSuccess } from "./feedback-button";
import { useFeedback } from "./feedback-provider";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const FEEDBACK_TYPES = [
  "Bug",
  "Feature Request",
  "UX Issue",
  "Question",
  "Other",
] as const;

const PRIORITIES = ["P0-Critical", "P1-High", "P2-Medium", "P3-Low"] as const;

/**
 * Map a feedback ID page prefix to a human-readable label.
 */
function humanLabel(feedbackId: string): string {
  const [page, section] = feedbackId.split(".", 2);
  const pageLabel = page
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const sectionLabel = section
    ? section.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Page";
  return `${pageLabel} › ${sectionLabel}`;
}

/* -------------------------------------------------------------------------- */
/*  Submit handler type                                                       */
/* -------------------------------------------------------------------------- */

export interface FeedbackSubmission {
  feedbackId: string;
  feedbackType: string;
  priority: string;
  subject: string;
  description: string;
  pageUrl: string;
  userAgent: string;
}

export type FeedbackSubmitHandler = (
  data: FeedbackSubmission,
) => Promise<{ success: boolean; message?: string }>;

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export interface FeedbackDialogProps {
  /** Async handler that persists the feedback. */
  onSubmit: FeedbackSubmitHandler;
}

/**
 * Shared feedback dialog.
 *
 * Renders a Radix Dialog that is controlled by the `FeedbackProvider` context.
 * Place this once in the console layout alongside the provider.
 */
export function FeedbackDialog({ onSubmit }: FeedbackDialogProps) {
  const { activeFeedbackId, closeFeedback } = useFeedback();
  const isOpen = activeFeedbackId !== null;

  const [feedbackType, setFeedbackType] = useState("Bug");
  const [priority, setPriority] = useState("P2-Medium");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setFeedbackType("Bug");
    setPriority("P2-Medium");
    setSubject("");
    setDescription("");
    setError(null);
    setSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    closeFeedback();
    // Reset after animation
    setTimeout(resetForm, 200);
  }, [closeFeedback, resetForm]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!activeFeedbackId) return;

      setSubmitting(true);
      setError(null);

      try {
        const result = await onSubmit({
          feedbackId: activeFeedbackId,
          feedbackType,
          priority,
          subject: subject.trim(),
          description: description.trim(),
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
        });

        if (result.success) {
          flashFeedbackSuccess(activeFeedbackId);
          handleClose();
        } else {
          setError(result.message || "Submission failed. Please try again.");
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [
      activeFeedbackId,
      feedbackType,
      priority,
      subject,
      description,
      onSubmit,
      handleClose,
    ],
  );

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={() => handleClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={clsx(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl",
            "dark:border-slate-700 dark:bg-slate-900",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          )}
        >
          <DialogPrimitive.Title className="text-lg font-semibold text-slate-900 dark:text-white">
            Send Feedback
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1 text-sm text-slate-500">
            {activeFeedbackId && humanLabel(activeFeedbackId)}
          </DialogPrimitive.Description>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Type + Priority row */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Type <span className="text-red-500">*</span>
                </span>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {FEEDBACK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Priority
                </span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Subject */}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Subject <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                maxLength={120}
                placeholder="Short summary…"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>

            {/* Description */}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Description <span className="text-red-500">*</span>
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                maxLength={2000}
                rows={4}
                placeholder="Describe the issue, suggestion, or question…"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>

            {/* Error */}
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="rounded-full border border-slate-200 bg-transparent px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !subject.trim() || !description.trim()}
                className="rounded-full bg-gradient-to-r from-sky-500 to-teal-400 px-5 py-2 text-sm font-medium text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </form>

          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:text-slate-600 focus:outline-none dark:hover:text-slate-300"
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

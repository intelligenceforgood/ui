"use client";

import { FeedbackDialog, FeedbackProvider } from "@i4g/ui-kit";
import type { ReactNode } from "react";
import { submitFeedback } from "@/lib/feedback-client";

/**
 * Client-side wrapper that provides feedback context to the console.
 *
 * Renders the shared FeedbackProvider and FeedbackDialog. Place this
 * inside the console layout so every page can access the feedback context.
 */
export function FeedbackShell({ children }: { children: ReactNode }) {
  const enabled = process.env.NEXT_PUBLIC_FEEDBACK_ENABLED !== "false";

  return (
    <FeedbackProvider enabled={enabled}>
      {children}
      <FeedbackDialog onSubmit={submitFeedback} />
    </FeedbackProvider>
  );
}

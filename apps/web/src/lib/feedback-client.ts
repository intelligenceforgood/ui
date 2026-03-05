"use client";

import type { FeedbackSubmission } from "@i4g/ui-kit";

/**
 * Submit feedback to the Next.js API route which proxies to Core.
 */
export async function submitFeedback(
  data: FeedbackSubmission,
): Promise<{ success: boolean; message?: string }> {
  const resp = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      feedback_id: data.feedbackId,
      feedback_type: data.feedbackType,
      priority: data.priority,
      subject: data.subject,
      description: data.description,
      page_url: data.pageUrl,
      user_agent: data.userAgent,
    }),
  });

  if (!resp.ok) {
    return { success: false, message: `Server error (${resp.status})` };
  }

  return resp.json();
}

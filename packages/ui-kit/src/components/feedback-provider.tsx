"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export interface FeedbackContextValue {
  /** Open the feedback dialog for a given feedback ID. */
  openFeedback: (feedbackId: string) => void;
  /** Close the feedback dialog. */
  closeFeedback: () => void;
  /** Currently active feedback ID, or null if dialog is closed. */
  activeFeedbackId: string | null;
  /** Whether feedback is globally enabled. */
  enabled: boolean;
}

const FeedbackContext = createContext<FeedbackContextValue>({
  openFeedback: () => {},
  closeFeedback: () => {},
  activeFeedbackId: null,
  enabled: false,
});

export interface FeedbackProviderProps {
  children: ReactNode;
  /** Set to false to hide all feedback buttons. */
  enabled?: boolean;
}

/**
 * Provides feedback dialog state to the component tree.
 *
 * Wrap the console layout with this provider so any `FeedbackButton` can
 * trigger the shared `FeedbackDialog`.
 */
export function FeedbackProvider({
  children,
  enabled = true,
}: FeedbackProviderProps) {
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);

  const openFeedback = useCallback((feedbackId: string) => {
    setActiveFeedbackId(feedbackId);
  }, []);

  const closeFeedback = useCallback(() => {
    setActiveFeedbackId(null);
  }, []);

  return (
    <FeedbackContext.Provider
      value={{ openFeedback, closeFeedback, activeFeedbackId, enabled }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

/**
 * Hook to access the feedback context.
 *
 * @returns The current feedback context value.
 */
export function useFeedback(): FeedbackContextValue {
  return useContext(FeedbackContext);
}

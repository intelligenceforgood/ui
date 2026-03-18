"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CaseActivity, CaseActivityResponse } from "@i4g/sdk";

/** Max polls before auto-stopping (prevents runaway polling if an
 * investigation is stuck in "running" forever).  600 × 10s = ~100 min. */
const MAX_POLLS = 600;

interface UseCaseActivityOptions {
  /** Polling interval in milliseconds. Default: 10000 (10s). */
  pollInterval?: number;
  /** Whether polling is enabled. Default: true. */
  enabled?: boolean;
}

interface UseCaseActivityReturn {
  activities: CaseActivity[];
  hasRunning: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook that polls case activity status at regular intervals.
 * Stops polling when all activities are in terminal state.
 * Resumes polling when refetch is called (e.g., after triggering an investigation).
 */
export function useCaseActivity(
  caseId: string,
  options?: UseCaseActivityOptions,
): UseCaseActivityReturn {
  const { pollInterval = 10_000, enabled = true } = options ?? {};

  const [activities, setActivities] = useState<CaseActivity[]>([]);
  const [hasRunning, setHasRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track whether polling should be active. Starts true, becomes false
  // when all activities are terminal, and resets to true on refetch.
  const shouldPollRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const pollCountRef = useRef(0);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}/activity`);
      if (!res.ok) throw new Error(`Activity fetch failed: ${res.status}`);
      const data: CaseActivityResponse = await res.json();
      if (!mountedRef.current) return;

      setActivities(data.activities);
      setHasRunning(data.hasRunning);
      setError(null);

      // Stop polling when nothing is running
      if (!data.hasRunning) {
        shouldPollRef.current = false;
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [caseId]);

  // Manually trigger a refetch and resume polling
  const refetch = useCallback(() => {
    shouldPollRef.current = true;
    pollCountRef.current = 0;
    setIsLoading(true);
    fetchActivity();
  }, [fetchActivity]);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchActivity();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      if (shouldPollRef.current) {
        pollCountRef.current += 1;
        if (pollCountRef.current >= MAX_POLLS) {
          shouldPollRef.current = false;
          return;
        }
        fetchActivity();
      }
    }, pollInterval);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [caseId, enabled, pollInterval, fetchActivity]);

  return { activities, hasRunning, isLoading, error, refetch };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  GuidanceCommand,
  SSIEvent,
  SSIEventType,
  SSISnapshot,
} from "@/types/ssi";

/** Connection state for the WebSocket. */
export type WSState = "connecting" | "connected" | "disconnected" | "error";

interface UseInvestigationMonitorOptions {
  /** Investigation ID to monitor. When `null`/`undefined`, no connection is made. */
  investigationId: string | null | undefined;
  /** Use the guidance endpoint (bidirectional) instead of monitor (read-only). */
  guidance?: boolean;
  /** Called for every incoming event. */
  onEvent?: (event: SSIEvent) => void;
  /** Called when a snapshot is received on connect. */
  onSnapshot?: (snapshot: SSISnapshot) => void;
}

interface UseInvestigationMonitorReturn {
  /** Current WebSocket connection state. */
  state: WSState;
  /** Latest screenshot (base64) received via snapshot or screenshot_update. */
  screenshot: string | null;
  /** Ordered list of events received during this session. */
  events: SSIEvent[];
  /** Latest snapshot data. */
  snapshot: SSISnapshot | null;
  /** Send a guidance command (only works in guidance mode). */
  sendGuidance: (command: GuidanceCommand) => void;
  /** Manually disconnect the WebSocket. */
  disconnect: () => void;
  /** Manually reconnect (e.g. after disconnect or error). */
  reconnect: () => void;
}

/**
 * React hook for real-time investigation monitoring via WebSocket.
 *
 * Connects to either `/ws/monitor/{id}` (read-only) or `/ws/guidance/{id}`
 * (bidirectional) on the SSI service. Provides live screenshots, event
 * streaming, and guidance command sending.
 */
export function useInvestigationMonitor({
  investigationId,
  guidance = false,
  onEvent,
  onSnapshot,
}: UseInvestigationMonitorOptions): UseInvestigationMonitorReturn {
  const [state, setState] = useState<WSState>("disconnected");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [events, setEvents] = useState<SSIEvent[]>([]);
  const [snapshot, setSnapshot] = useState<SSISnapshot | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);
  const onSnapshotRef = useRef(onSnapshot);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MAX_RETRIES = 10;
  const BASE_DELAY_MS = 1_000;

  // Keep callback refs current without triggering reconnections
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);
  useEffect(() => {
    onSnapshotRef.current = onSnapshot;
  }, [onSnapshot]);

  const connect = useCallback(() => {
    if (!investigationId) return;

    // Determine the WebSocket URL. In the browser, derive from window.location.
    // The SSI API URL is typically `ws://localhost:8100`.
    const ssiWsBase =
      process.env.NEXT_PUBLIC_SSI_WS_URL ??
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
    const path = guidance
      ? `/ws/guidance/${investigationId}`
      : `/ws/monitor/${investigationId}`;
    const wsUrl = `${ssiWsBase}${path}`;

    setState("connecting");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setState("connected");
      retryCountRef.current = 0;
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as SSIEvent & {
          type?: string;
          data?: Record<string, unknown>;
        };

        // Handle snapshot (sent on connect)
        if (
          msg.type === "snapshot" ||
          msg.event_type === ("snapshot" as SSIEventType)
        ) {
          const snap = (msg.data ?? msg) as unknown as SSISnapshot;
          setSnapshot(snap);
          if (snap.screenshot_b64) {
            setScreenshot(snap.screenshot_b64);
          }
          onSnapshotRef.current?.(snap);
          return;
        }

        // Handle keepalive (no-op)
        if (msg.type === "keepalive") return;

        // Handle standard events
        const event: SSIEvent = {
          event_type: (msg.event_type ?? msg.type ?? "log") as SSIEventType,
          timestamp: msg.timestamp ?? new Date().toISOString(),
          investigation_id: msg.investigation_id ?? investigationId,
          data: msg.data ?? {},
        };

        // Extract screenshot from screenshot_update events
        if (
          event.event_type === "screenshot_update" &&
          typeof event.data.screenshot_b64 === "string"
        ) {
          setScreenshot(event.data.screenshot_b64);
        }

        setEvents((prev) => [...prev, event]);
        onEventRef.current?.(event);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onerror = () => {
      // Error state is transient — onclose will fire next and handle retry
    };

    ws.onclose = (evt) => {
      // Guard against stale closures (React Strict Mode double-invokes effects,
      // causing ws1.onclose to fire after ws2 has already replaced it).
      // Only run teardown logic when this ws is still the active one, or when
      // the ref was already cleared by an intentional disconnect() call.
      if (wsRef.current !== ws && wsRef.current !== null) return;
      wsRef.current = null;

      // Auto-retry with exponential backoff when the investigation bus
      // isn't registered yet (code 4004) or on unexpected disconnects.
      // Don't retry normal closures (code 1000) or after max retries.
      if (
        evt.code !== 1000 &&
        retryCountRef.current < MAX_RETRIES &&
        investigationId
      ) {
        const delay = Math.min(
          BASE_DELAY_MS * 2 ** retryCountRef.current,
          10_000,
        );
        retryCountRef.current += 1;
        setState("connecting");
        retryTimerRef.current = setTimeout(connect, delay);
      } else {
        setState("disconnected");
      }
    };
  }, [investigationId, guidance]);

  const disconnect = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }
    retryCountRef.current = 0;
    // Do NOT call setState here. Setting "disconnected" synchronously in cleanup
    // causes a brief "Live view unavailable" flash in React Strict Mode
    // (cleanup fires before the re-mount connect() can set "connecting").
    // The ws.onclose handler is the single source of truth for state — it fires
    // immediately after close() and correctly sets "disconnected" only for
    // intentional disconnects (wsRef already null → guard lets it through).
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setEvents([]);
    setScreenshot(null);
    setSnapshot(null);
    // Small delay to allow cleanup
    setTimeout(connect, 100);
  }, [disconnect, connect]);

  const sendGuidance = useCallback(
    (command: GuidanceCommand) => {
      if (!guidance) {
        console.warn("sendGuidance called but guidance mode is not enabled.");
        return;
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(command));
      }
    },
    [guidance],
  );

  // Auto-connect when investigationId changes
  useEffect(() => {
    if (investigationId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [investigationId, connect, disconnect]);

  return {
    state,
    screenshot,
    events,
    snapshot,
    sendGuidance,
    disconnect,
    reconnect,
  };
}

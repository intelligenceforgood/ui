"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  GuidanceCommand,
  SSIEvent,
  SSIEventType,
  SSISnapshot,
} from "@/types/ssi";

/** Connection state for the monitor. */
export type WSState = "connecting" | "connected" | "disconnected" | "error";

/** Transport used for the current connection. */
export type MonitorTransport = "websocket" | "sse";

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
  /** Current connection state. */
  state: WSState;
  /** Active transport being used. */
  transport: MonitorTransport;
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
 * React hook for real-time investigation monitoring.
 *
 * **Transport selection:**
 * - When `NEXT_PUBLIC_SSI_WS_URL` is set (local dev): connects via WebSocket
 *   to the SSI service directly at `/ws/monitor/{id}` or `/ws/guidance/{id}`.
 * - When `NEXT_PUBLIC_SSI_WS_URL` is **not** set (cloud/production): uses
 *   Server-Sent Events via `GET /api/events/ssi/{id}/stream` proxied through
 *   the Next.js API to the core service.  Screenshots are received as inline
 *   base64 in the event payload — identical format to the WebSocket path.
 */
export function useInvestigationMonitor({
  investigationId,
  guidance = false,
  onEvent,
  onSnapshot,
}: UseInvestigationMonitorOptions): UseInvestigationMonitorReturn {
  const [state, setState] = useState<WSState>("disconnected");
  const [transport, setTransport] = useState<MonitorTransport>("websocket");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [events, setEvents] = useState<SSIEvent[]>([]);
  const [snapshot, setSnapshot] = useState<SSISnapshot | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);
  const onSnapshotRef = useRef(onSnapshot);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MAX_RETRIES = 10;
  const BASE_DELAY_MS = 1_000;

  /**
   * Determine whether to use WebSocket (local dev) or SSE (cloud).
   *
   * WebSocket is used ONLY when `NEXT_PUBLIC_SSI_WS_URL` is set AND the page
   * is served over plain HTTP.  In production / cloud, the page is always
   * HTTPS — so even if the env var was accidentally baked into the Docker
   * image, the runtime check prevents the hook from trying `ws://localhost`.
   */
  function shouldUseWebSocket(): boolean {
    if (!process.env.NEXT_PUBLIC_SSI_WS_URL) return false;
    if (typeof window === "undefined") return false;
    return window.location.protocol !== "https:";
  }

  // Keep callback refs current without triggering reconnections.
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);
  useEffect(() => {
    onSnapshotRef.current = onSnapshot;
  }, [onSnapshot]);

  // ---------------------------------------------------------------------------
  // Shared event processing
  // ---------------------------------------------------------------------------

  const processMessage = useCallback(
    (raw: string) => {
      try {
        const msg = JSON.parse(raw) as SSIEvent & {
          type?: string;
          data?: Record<string, unknown>;
        };

        // Handle snapshot (sent on WebSocket connect).
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

        // Handle keepalive (no-op).
        if (msg.type === "keepalive") return;

        const event: SSIEvent = {
          event_type: (msg.event_type ?? msg.type ?? "log") as SSIEventType,
          timestamp: msg.timestamp ?? new Date().toISOString(),
          investigation_id: msg.investigation_id ?? investigationId ?? "",
          data: msg.data ?? {},
        };

        // Extract screenshot from screenshot_update events.
        if (
          event.event_type === "screenshot_update" &&
          typeof event.data.screenshot_b64 === "string"
        ) {
          setScreenshot(event.data.screenshot_b64);
        }

        setEvents((prev) => [...prev, event]);
        onEventRef.current?.(event);
      } catch {
        // Ignore malformed messages.
      }
    },
    [investigationId],
  );

  // ---------------------------------------------------------------------------
  // SSE transport (cloud mode — NEXT_PUBLIC_SSI_WS_URL not set)
  // ---------------------------------------------------------------------------

  const connectSSE = useCallback(() => {
    if (!investigationId) return;

    setState("connecting");
    setTransport("sse");

    const streamUrl = `/api/events/ssi/${investigationId}/stream`;
    console.debug("[Monitor] Opening SSE to %s", streamUrl);
    const es = new EventSource(streamUrl);
    esRef.current = es;

    es.onopen = () => {
      console.debug("[Monitor] SSE connected for %s", investigationId);
      setState("connected");
      retryCountRef.current = 0;
    };

    es.onmessage = (evt) => {
      processMessage(evt.data as string);
    };

    es.onerror = () => {
      console.warn(
        "[Monitor] SSE error for %s (retry %d/%d)",
        investigationId,
        retryCountRef.current + 1,
        MAX_RETRIES,
      );
      es.close();
      esRef.current = null;

      if (retryCountRef.current < MAX_RETRIES && investigationId) {
        const delay = Math.min(
          BASE_DELAY_MS * 2 ** retryCountRef.current,
          10_000,
        );
        retryCountRef.current += 1;
        setState("connecting");
        retryTimerRef.current = setTimeout(connectSSE, delay);
      } else {
        setState("error");
      }
    };
  }, [investigationId, processMessage]);

  // ---------------------------------------------------------------------------
  // WebSocket transport (local dev — NEXT_PUBLIC_SSI_WS_URL is set)
  // ---------------------------------------------------------------------------

  const connect = useCallback(() => {
    if (!investigationId) return;

    const ssiWsBase =
      process.env.NEXT_PUBLIC_SSI_WS_URL ??
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
    const path = guidance
      ? `/ws/guidance/${investigationId}`
      : `/ws/monitor/${investigationId}`;
    const wsUrl = `${ssiWsBase}${path}`;

    setState("connecting");
    setTransport("websocket");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setState("connected");
      retryCountRef.current = 0;
    };

    ws.onmessage = (evt) => {
      processMessage(evt.data as string);
    };

    ws.onerror = () => {
      // Error state is transient — onclose will fire next and handle retry.
    };

    ws.onclose = (evt) => {
      // Guard against stale closures (React Strict Mode double-invokes effects).
      if (wsRef.current !== ws && wsRef.current !== null) return;
      wsRef.current = null;

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
  }, [investigationId, guidance, processMessage]);

  const disconnect = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    // Close WebSocket if active.
    if (wsRef.current) {
      wsRef.current.close(1000);
      wsRef.current = null;
    }
    // Close EventSource if active.
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    retryCountRef.current = 0;
    // Do NOT call setState here — ws.onclose is the source of truth for WS state.
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setEvents([]);
    setScreenshot(null);
    setSnapshot(null);
    setTimeout(() => {
      if (shouldUseWebSocket()) {
        connect();
      } else {
        connectSSE();
      }
    }, 100);
  }, [disconnect, connect, connectSSE]);

  const sendGuidance = useCallback(
    (command: GuidanceCommand) => {
      if (!guidance) {
        console.warn("sendGuidance called but guidance mode is not enabled.");
        return;
      }

      // WebSocket path (local dev) — send directly over the open socket.
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(command));
        return;
      }

      // HTTP path (cloud / SSE mode) — POST via the Next.js proxy to core.
      if (investigationId) {
        const guidanceUrl = `/api/events/ssi/${investigationId}/guidance`;
        fetch(guidanceUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        })
          .then((res) => {
            if (!res.ok) {
              console.warn(
                "[Monitor] Guidance POST returned %d for %s",
                res.status,
                investigationId,
              );
            }
          })
          .catch((err) => {
            console.error(
              "[Monitor] Guidance POST failed for %s:",
              investigationId,
              err,
            );
          });
      }
    },
    [guidance, investigationId],
  );

  // Auto-connect when investigationId changes.
  useEffect(() => {
    if (!investigationId) return;
    // Use WebSocket ONLY for local dev: env var must be set AND page must
    // be served over HTTP.  This prevents an accidentally baked-in
    // NEXT_PUBLIC_SSI_WS_URL from hijacking transport in cloud (HTTPS).
    const ws = shouldUseWebSocket();
    console.debug(
      "[Monitor] id=%s transport=%s wsUrl=%s proto=%s",
      investigationId,
      ws ? "websocket" : "sse",
      process.env.NEXT_PUBLIC_SSI_WS_URL ?? "(unset)",
      typeof window !== "undefined" ? window.location.protocol : "n/a",
    );
    if (ws) {
      connect();
    } else {
      connectSSE();
    }
    return () => {
      disconnect();
    };
  }, [investigationId, connect, connectSSE, disconnect]);

  return {
    state,
    transport,
    screenshot,
    events,
    snapshot,
    sendGuidance,
    disconnect,
    reconnect,
  };
}

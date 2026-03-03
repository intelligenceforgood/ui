/**
 * SSE proxy for SSI investigation live events — Phase 3B.
 *
 * Polls `GET /events/ssi/{scanId}` on the core API for new events and
 * re-emits them to the browser as Server-Sent Events.
 *
 * **Why not proxy the upstream SSE stream directly?**
 * Next.js patches the global `fetch` to support its data cache.  Without
 * `cache: "no-store"` the patched fetch tries to buffer the *entire*
 * response body before resolving — but an SSE stream never ends, so the
 * `await fetch(…)` hangs until the Cloud Run request timeout fires (or
 * the browser gives up, whichever comes first).  Even with
 * `cache: "no-store"` the behaviour is fragile across Next.js versions.
 *
 * The polling approach is simpler and fully reliable: each poll is a
 * short-lived `fetch` that resolves immediately with a JSON array of
 * events.  New events are forwarded as SSE `data:` frames.  A keepalive
 * comment (`: keepalive`) is sent every cycle to prevent proxy/LB idle
 * timeouts.
 *
 * The route is accessed at `/api/events/ssi/{scanId}/stream`.
 */

import { NextRequest } from "next/server";
import { getIapHeaders } from "@/lib/server/auth-helpers";

// Node.js runtime required for streaming — Edge runtime does not support
// the fetch streaming patterns used here with IAP auth headers.
export const runtime = "nodejs";
// Disable Next.js response caching for SSE.
export const dynamic = "force-dynamic";

/** Polling interval in milliseconds. */
const POLL_INTERVAL_MS = 2_500;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> },
) {
  const { scanId } = await params;

  console.info("[SSE Proxy] Stream opened for scan %s", scanId);

  const apiUrl =
    process.env.I4G_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:8000";

  const encoder = new TextEncoder();
  let cancelled = false;

  const stream = new ReadableStream({
    start(controller) {
      // Send an initial SSE comment to flush response headers and
      // trigger the browser's EventSource.onopen callback immediately.
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Fire-and-forget async polling loop.
      void pollLoop(controller);
    },
    cancel() {
      cancelled = true;
    },
  });

  async function pollLoop(controller: ReadableStreamDefaultController) {
    let afterTimestamp: string | null = null;

    // Helper: safely enqueue, returning false if the stream is closed.
    function send(text: string): boolean {
      try {
        controller.enqueue(encoder.encode(text));
        return true;
      } catch {
        cancelled = true;
        return false;
      }
    }

    try {
      const headers = await getIapHeaders();

      while (!cancelled) {
        try {
          // Build URL with optional `after` query.
          const url = new URL(`${apiUrl}/events/ssi/${scanId}`);
          if (afterTimestamp) {
            url.searchParams.set("after", afterTimestamp);
          }

          const res = await fetch(url.toString(), {
            headers: { ...headers, Accept: "application/json" },
            cache: "no-store",
          });

          if (res.ok) {
            const json = (await res.json()) as {
              items: Array<Record<string, unknown>>;
            };
            for (const ev of json.items ?? []) {
              if (!send(`data: ${JSON.stringify(ev)}\n\n`)) return;
              // Track cursor so next poll is incremental.
              if (typeof ev.timestamp === "string") {
                afterTimestamp = ev.timestamp;
              }
            }
          } else {
            console.warn(
              `[SSE Proxy] Upstream ${res.status} for scan ${scanId}`,
            );
          }
        } catch (err) {
          console.error(
            "[SSE Proxy] Poll error for scan",
            scanId,
            err instanceof Error ? err.message : err,
          );
        }

        // Keepalive comment — prevents proxies/LBs from treating the
        // connection as idle.
        if (!send(": keepalive\n\n")) return;

        // Wait before next poll.
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, POLL_INTERVAL_MS);
          // If the stream is cancelled while sleeping, clear the timer.
          if (cancelled) {
            clearTimeout(timer);
            resolve();
          }
        });
      }
    } catch (err) {
      console.error(
        "[SSE Proxy] Fatal error for scan",
        scanId,
        err instanceof Error ? err.message : err,
      );
    } finally {
      try {
        controller.close();
      } catch {
        /* already closed */
      }
    }
  }

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

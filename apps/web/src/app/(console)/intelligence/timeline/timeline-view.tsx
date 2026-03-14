"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Button, Badge } from "@i4g/ui-kit";
import type { TimelineResponse } from "@i4g/sdk";

type Granularity = "day" | "week" | "month";

const TRACK_COLORS: Record<string, string> = {
  cases: "#3b82f6",
  indicators: "#10b981",
  campaigns: "#f59e0b",
};

export default function TimelineView() {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("90d");
  const [granularity, setGranularity] = useState<Granularity>("week");

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ period, granularity });
      const res = await fetch(`/api/intelligence/timeline?${query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: TimelineResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  }, [period, granularity]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // Compute max value across all tracks for scaling
  const maxValue = data
    ? Math.max(
        1,
        ...data.tracks.flatMap((t) =>
          t.data.map((d) => Number((d as Record<string, unknown>).count ?? 0)),
        ),
      )
    : 1;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex gap-1">
          {(["7d", "30d", "90d", "quarter", "year"] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "primary" : "ghost"}
              onClick={() => setPeriod(p)}
            >
              {p}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["day", "week", "month"] as const).map((g) => (
            <Button
              key={g}
              size="sm"
              variant={granularity === g ? "primary" : "ghost"}
              onClick={() => setGranularity(g)}
            >
              {g}
            </Button>
          ))}
        </div>
      </Card>

      {loading && (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600" />
        </div>
      )}

      {error && <Card className="p-4 text-red-500">{error}</Card>}

      {data && !loading && (
        <div className="space-y-4">
          {data.tracks.map((track) => (
            <Card key={track.track} className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: TRACK_COLORS[track.track] ?? "#6b7280",
                  }}
                />
                <h3 className="text-sm font-semibold capitalize text-slate-900 dark:text-white">
                  {track.track}
                </h3>
                <Badge variant="default">{track.data.length} periods</Badge>
              </div>

              {/* Bar chart row */}
              <div className="flex h-24 items-end gap-px overflow-x-auto">
                {track.data.map((d, i) => {
                  const rec = d as Record<string, unknown>;
                  const count = Number(rec.count ?? 0);
                  const pct = Math.max(2, (count / maxValue) * 100);
                  return (
                    <div
                      key={i}
                      className="group relative flex min-w-[8px] flex-1 flex-col items-center justify-end"
                    >
                      <div
                        className="w-full min-w-[6px] rounded-t transition-all hover:opacity-80"
                        style={{
                          height: `${pct}%`,
                          backgroundColor:
                            TRACK_COLORS[track.track] ?? "#6b7280",
                        }}
                      />
                      {/* Tooltip */}
                      <div className="pointer-events-none absolute -top-10 hidden whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white group-hover:block">
                        {String(rec.period ?? "")}: {count}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-axis labels — first and last */}
              {track.data.length > 0 && (
                <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                  <span>
                    {String(
                      (track.data[0] as Record<string, unknown>).period ?? "",
                    )}
                  </span>
                  <span>
                    {String(
                      (
                        track.data[track.data.length - 1] as Record<
                          string,
                          unknown
                        >
                      ).period ?? "",
                    )}
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

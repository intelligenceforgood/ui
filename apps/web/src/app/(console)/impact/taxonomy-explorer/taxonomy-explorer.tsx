"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Button } from "@i4g/ui-kit";
import { CodeTooltip } from "@/components/code-tooltip";
import type { SankeyResponse, HeatmapCell, TaxonomyTrendPoint } from "@i4g/sdk";

type ViewMode = "sankey" | "heatmap" | "trend";

const CATEGORY_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export default function TaxonomyExplorer() {
  const [viewMode, setViewMode] = useState<ViewMode>("sankey");
  const [period, setPeriod] = useState("90d");
  const [sankeyData, setSankeyData] = useState<SankeyResponse | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
  const [trendData, setTrendData] = useState<TaxonomyTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (viewMode === "sankey") {
        const res = await fetch(`/api/impact/taxonomy/sankey?period=${period}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setSankeyData(await res.json());
      } else if (viewMode === "heatmap") {
        const res = await fetch(
          `/api/impact/taxonomy/heatmap?period=${period}&granularity=week`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setHeatmapData(await res.json());
      } else {
        const res = await fetch(`/api/impact/taxonomy/trend?period=${period}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setTrendData(await res.json());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [viewMode, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex gap-1">
          {(["sankey", "heatmap", "trend"] as const).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={viewMode === m ? "primary" : "ghost"}
              onClick={() => setViewMode(m)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["30d", "90d", "quarter", "year"] as const).map((p) => (
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
      </Card>

      {loading && (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600" />
        </div>
      )}

      {error && <Card className="p-4 text-red-500">{error}</Card>}

      {/* Sankey View */}
      {!loading && viewMode === "sankey" && sankeyData && (
        <SankeyView data={sankeyData} />
      )}

      {/* Heatmap View */}
      {!loading && viewMode === "heatmap" && heatmapData.length > 0 && (
        <HeatmapView data={heatmapData} />
      )}

      {/* Trend View */}
      {!loading && viewMode === "trend" && trendData.length > 0 && (
        <TrendView data={trendData} />
      )}
    </div>
  );
}

function SankeyView({ data }: { data: SankeyResponse }) {
  // Simplified Sankey — render as a flow table
  const categories = data.nodes.filter((n) => !n.id.includes(":"));
  const subcategories = data.nodes.filter((n) => n.id.includes(":"));

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
        Taxonomy Flow: Category → Subcategory
      </h3>
      <div className="grid grid-cols-2 gap-8">
        {/* Categories */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500">Categories</p>
          {categories.map((node, i) => (
            <div
              key={node.id}
              className="flex items-center justify-between rounded px-3 py-2"
              style={{
                backgroundColor: `${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}15`,
                borderLeft: `4px solid ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`,
              }}
            >
              <CodeTooltip code={node.code || node.id}>
                <span className="text-sm font-medium">{node.label}</span>
              </CodeTooltip>
              <span className="text-xs font-semibold text-slate-500">
                {node.value}
              </span>
            </div>
          ))}
        </div>
        {/* Subcategories */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500">Subcategories</p>
          {subcategories
            .sort((a, b) => b.value - a.value)
            .slice(0, 15)
            .map((node) => {
              const catIndex = categories.findIndex((c) =>
                node.id.startsWith(c.id + ":"),
              );
              const color =
                CATEGORY_COLORS[catIndex % CATEGORY_COLORS.length] ?? "#6b7280";
              return (
                <div
                  key={node.id}
                  className="flex items-center justify-between rounded px-3 py-1"
                  style={{ backgroundColor: `${color}10` }}
                >
                  <CodeTooltip code={node.code || node.id}>
                    <span className="text-sm">{node.label}</span>
                  </CodeTooltip>
                  <span className="text-xs text-slate-500">{node.value}</span>
                </div>
              );
            })}
        </div>
      </div>
      {/* Links summary */}
      <div className="mt-4">
        <p className="text-xs text-slate-400">
          {data.links.length} flows · {data.nodes.length} nodes
        </p>
      </div>
    </Card>
  );
}

function HeatmapView({ data }: { data: HeatmapCell[] }) {
  const categories = [...new Set(data.map((d) => d.category))].sort();
  const periods = [...new Set(data.map((d) => d.period))].sort();
  const cellMap = new Map(
    data.map((d) => [`${d.category}:${d.period}`, d.count]),
  );
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <Card className="overflow-x-auto p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
        Taxonomy × Time Heatmap
      </h3>
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="p-1 text-left text-slate-500">Category</th>
            {periods.map((p) => (
              <th
                key={p}
                className="p-1 text-center text-slate-400"
                style={{ writingMode: "vertical-rl" }}
              >
                {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const catRecord = data.find((d) => d.category === cat);
            const code = catRecord?.categoryCode ?? cat;
            return (
              <tr key={cat}>
                <td className="whitespace-nowrap p-1 font-medium">
                  <CodeTooltip code={code || cat} side="right">
                    {cat}
                  </CodeTooltip>
                </td>
                {periods.map((per) => {
                  const count = cellMap.get(`${cat}:${per}`) ?? 0;
                  const intensity = count / maxCount;
                  return (
                    <td key={per} className="p-0.5">
                      <div
                        className="mx-auto h-5 w-5 rounded-sm"
                        style={{
                          backgroundColor: `rgba(59, 130, 246, ${Math.max(0.05, intensity)})`,
                        }}
                        title={`${cat} / ${per}: ${count}`}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function TrendView({ data }: { data: TaxonomyTrendPoint[] }) {
  const categories = [...new Set(data.map((d) => d.category))].sort();
  const periods = [...new Set(data.map((d) => d.period))].sort();

  // Build per-category series
  const series = categories.map((cat, i) => {
    const catRecord = data.find((d) => d.category === cat);
    const code = catRecord?.categoryCode ?? cat;
    const points = periods.map(
      (per) =>
        data.find((d) => d.category === cat && d.period === per)?.count ?? 0,
    );
    return {
      category: cat,
      code,
      points,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]!,
    };
  });

  const maxVal = Math.max(1, ...series.flatMap((s) => s.points));

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
        Taxonomy Trend
      </h3>
      {/* Simple sparkline-style rendering per category */}
      <div className="space-y-3">
        {series.map((s) => (
          <div key={s.category}>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <CodeTooltip code={s.code || s.category}>
                <span className="text-xs font-medium">
                  {s.category} (total: {s.points.reduce((a, b) => a + b, 0)})
                </span>
              </CodeTooltip>
            </div>
            <div className="mt-1 flex h-8 items-end gap-px">
              {s.points.map((val, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${Math.max(4, (val / maxVal) * 100)}%`,
                    backgroundColor: s.color,
                    opacity: 0.8,
                  }}
                  title={`${periods[i]}: ${val}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* X-axis labels */}
      {periods.length > 0 && (
        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
          <span>{periods[0]}</span>
          <span>{periods[periods.length - 1]}</span>
        </div>
      )}
    </Card>
  );
}

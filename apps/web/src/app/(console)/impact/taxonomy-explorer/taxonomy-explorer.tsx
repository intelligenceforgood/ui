"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Button } from "@i4g/ui-kit";
import type { SankeyResponse, HeatmapCell, TaxonomyTrendPoint } from "@i4g/sdk";
import {
  Sankey,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

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

export default function TaxonomyExplorer({
  initialSankeyData,
}: {
  initialSankeyData: SankeyResponse;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("sankey");
  const [period, setPeriod] = useState("90d");
  const [sankeyData, setSankeyData] = useState<SankeyResponse | null>(
    initialSankeyData,
  );
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
  const [trendData, setTrendData] = useState<TaxonomyTrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (currentView: ViewMode, currentPeriod: string) => {
      setLoading(true);
      setError(null);
      try {
        if (currentView === "sankey") {
          const res = await fetch(
            `/api/impact/taxonomy/sankey?period=${currentPeriod}`,
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          setSankeyData(await res.json());
        } else if (currentView === "heatmap") {
          const res = await fetch(
            `/api/impact/taxonomy/heatmap?period=${currentPeriod}&granularity=week`,
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          setHeatmapData(await res.json());
        } else {
          const res = await fetch(
            `/api/impact/taxonomy/trend?period=${currentPeriod}`,
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          setTrendData(await res.json());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    // Skip fetch for initial sankey data
    if (
      viewMode === "sankey" &&
      period === "90d" &&
      sankeyData === initialSankeyData
    ) {
      return;
    }
    fetchData(viewMode, period);
  }, [viewMode, period, fetchData, initialSankeyData, sankeyData]);

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
  const nodes = data.nodes.map((n) => ({ ...n, name: n.label }));
  const links = data.links
    .map((l) => ({
      source: nodes.findIndex((n) => n.id === l.source),
      target: nodes.findIndex((n) => n.id === l.target),
      value: l.value,
    }))
    .filter((l) => l.source !== -1 && l.target !== -1);

  return (
    <Card className="flex h-[500px] flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Taxonomy Flow: Category → Subcategory
        </h3>
        <p className="text-xs text-slate-400">
          {data.links.length} flows · {data.nodes.length} nodes
        </p>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={{ nodes, links }}
            node={{ stroke: "#fff", strokeWidth: 2 }}
            nodePadding={50}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            link={{ stroke: "#e2e8f0" }}
          >
            <RechartsTooltip />
          </Sankey>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function HeatmapView({ data }: { data: HeatmapCell[] }) {
  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <Card className="flex h-[500px] flex-col p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
        Taxonomy × Time Heatmap
      </h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 100 }}>
            <XAxis
              type="category"
              dataKey="period"
              name="Period"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              allowDuplicatedCategory={false}
            />
            <YAxis
              type="category"
              dataKey="category"
              name="Category"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              width={100}
              allowDuplicatedCategory={false}
            />
            <ZAxis
              type="number"
              dataKey="count"
              name="Count"
              range={[40, 400]}
            />
            <RechartsTooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const cellData = payload[0].payload;
                return (
                  <div className="rounded-sm border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {cellData.category}
                    </p>
                    <p className="text-xs text-slate-500">{cellData.period}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Cases: {cellData.count}
                    </p>
                  </div>
                );
              }}
            />
            <Scatter data={data} fill="#3b82f6">
              {data.map((entry, index) => {
                const intensity = Math.max(0.1, entry.count / maxCount);
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={`rgba(59, 130, 246, ${intensity})`}
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function TrendView({ data }: { data: TaxonomyTrendPoint[] }) {
  const categories = [...new Set(data.map((d) => d.category))].sort();
  const periods = [...new Set(data.map((d) => d.period))].sort();

  const chartData = periods.map((period) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const point: any = { period };
    categories.forEach((cat) => {
      const match = data.find((d) => d.period === period && d.category === cat);
      point[cat] = match ? match.count : 0;
    });
    return point;
  });

  return (
    <Card className="flex h-[500px] flex-col p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
        Taxonomy Trend
      </h3>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="period"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} width={40} />
            <RechartsTooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {categories.map((cat, i) => (
              <Line
                key={cat}
                type="monotone"
                dataKey={cat}
                stroke={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

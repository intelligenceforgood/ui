"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Button, Input, Badge } from "@i4g/ui-kit";
import type {
  GraphPayload,
  GraphNode,
  GraphEdge,
  ClusterSummary,
} from "@i4g/sdk";
import {
  Crosshair,
  Download,
  ExternalLink,
  HelpCircle,
  Maximize2,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";
import { entityTypeColor, entityTypeLabel } from "@/lib/entity-types";

const EDGE_COLORS: Record<string, string> = {
  "co-occurrence": "#94a3b8",
  "shared-ip": "#f97316",
  "same-campaign": "#3b82f6",
  infrastructure: "#a855f7",
  "shared-registrar": "#a855f7",
  "shared-hosting": "#a855f7",
  default: "#cbd5e1",
};

const CLUSTER_COLORS = [
  "#6366f1",
  "#f43f5e",
  "#0ea5e9",
  "#84cc16",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#a855f7",
  "#f97316",
  "#06b6d4",
];

const EDGE_DESCRIPTIONS: Record<string, string> = {
  "co-occurrence": "These entities appear together in the same fraud case(s).",
  "shared-ip": "These entities share infrastructure (IP address).",
  "same-campaign": "These entities are linked to the same threat campaign.",
  infrastructure:
    "These entities share hosting or registration infrastructure.",
  "shared-registrar": "These domains share the same registrar.",
  "shared-hosting": "These entities share hosting infrastructure.",
  wallet_cluster: "These wallets belong to the same on-chain cluster.",
};

interface NodePosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
  node: GraphNode;
  pinned: boolean;
}

export default function NetworkGraph() {
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<GraphPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seedType, setSeedType] = useState(searchParams.get("seed_type") ?? "");
  const [seedValue, setSeedValue] = useState(
    searchParams.get("seed_value") ?? "",
  );
  const [autoLoad, setAutoLoad] = useState(
    !!(
      searchParams.get("seed_type") &&
      (searchParams.get("seed_value") || searchParams.get("seed"))
    ),
  );
  const [hops, setHops] = useState(1);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [positions, setPositions] = useState<Map<string, NodePosition>>(
    new Map(),
  );
  const [scale, setScale] = useState(1);
  const [showClusters, setShowClusters] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [hoveredCluster, setHoveredCluster] = useState<ClusterSummary | null>(
    null,
  );
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const animRef = useRef<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<GraphEdge | null>(null);
  const [graphSearch, setGraphSearch] = useState("");
  const [entityTypes, setEntityTypes] = useState<
    { value: string; label: string }[]
  >([]);

  // Check if this is a case-seeded graph
  const isCaseSeed = searchParams.get("seed_type") === "case";
  const caseSeedId = searchParams.get("seed") ?? "";

  // Compute seed string from type + value (for entity seeds)
  const seed = isCaseSeed
    ? caseSeedId
    : seedType && seedValue.trim()
      ? `${seedType}:${seedValue.trim()}`
      : "";

  // The seed_type to pass to the API
  const apiSeedType = isCaseSeed ? "case" : "entity";

  // Fetch available entity types from the API
  useEffect(() => {
    fetch("/api/intelligence/entities/type-labels")
      .then((r) => (r.ok ? r.json() : []))
      .then((items: { value: string; label: string }[]) => {
        setEntityTypes(items);
        if (items.length > 0 && !seedType) {
          setSeedType(items[0]!.value);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchGraph = useCallback(async () => {
    if (!seed) return;
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        seed,
        hops: String(hops),
        seed_type: apiSeedType,
      });
      const res = await fetch(`/api/intelligence/graph?${query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: GraphPayload = await res.json();
      setGraphData(data);

      // Initialise positions
      const posMap = new Map<string, NodePosition>();
      data.nodes.forEach((n, i) => {
        const layoutPos = data.layout?.[n.id];
        const angle = (2 * Math.PI * i) / data.nodes.length;
        posMap.set(n.id, {
          x: layoutPos?.x ?? 400 + 200 * Math.cos(angle),
          y: layoutPos?.y ?? 300 + 200 * Math.sin(angle),
          vx: 0,
          vy: 0,
          node: n,
          pinned: !!layoutPos,
        });
      });
      setPositions(posMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load graph");
    } finally {
      setLoading(false);
    }
  }, [seed, hops, apiSeedType]);

  // Auto-load graph when arriving with URL params
  useEffect(() => {
    if (autoLoad && seed) {
      setAutoLoad(false);
      fetchGraph();
    }
  }, [autoLoad, seed, fetchGraph]);

  // Simple force simulation
  useEffect(() => {
    if (!graphData || positions.size === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const posArr = Array.from(positions.values());
    const edgeArr = graphData.edges;

    let tickCount = 0;
    const maxTicks = 300;

    function tick() {
      if (tickCount >= maxTicks) return;
      tickCount++;

      // Repulsion
      for (let i = 0; i < posArr.length; i++) {
        for (let j = i + 1; j < posArr.length; j++) {
          const a = posArr[i]!;
          const b = posArr[j]!;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = 5000 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          if (!a.pinned) {
            a.vx -= fx;
            a.vy -= fy;
          }
          if (!b.pinned) {
            b.vx += fx;
            b.vy += fy;
          }
        }
      }

      // Attraction along edges
      for (const edge of edgeArr) {
        const a = positions.get(edge.source);
        const b = positions.get(edge.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = (dist - 100) * 0.01;
        const fx = (dx / Math.max(dist, 1)) * force;
        const fy = (dy / Math.max(dist, 1)) * force;
        if (!a.pinned) {
          a.vx += fx;
          a.vy += fy;
        }
        if (!b.pinned) {
          b.vx -= fx;
          b.vy -= fy;
        }
      }

      // Apply velocity with damping
      for (const p of posArr) {
        if (p.pinned) continue;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.x += p.vx;
        p.y += p.vy;
      }

      draw();
      animRef.current = requestAnimationFrame(tick);
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(scale, scale);

      // Draw edges
      for (const edge of edgeArr) {
        const a = positions.get(edge.source);
        const b = positions.get(edge.target);
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = EDGE_COLORS[edge.edgeType] ?? EDGE_COLORS["default"]!;
        ctx.lineWidth = Math.min(edge.weight, 4);
        if (edge.edgeType === "same-campaign") ctx.setLineDash([5, 5]);
        else ctx.setLineDash([]);
        ctx.stroke();

        // Edge label on hover
        if (
          hoveredEdge &&
          edge.source === hoveredEdge.source &&
          edge.target === hoveredEdge.target
        ) {
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          ctx.fillStyle = "#475569";
          ctx.font = "bold 10px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(
            `${edge.weight} case${edge.weight !== 1 ? "s" : ""}`,
            midX,
            midY - 6,
          );
        }
      }

      // Draw nodes
      const searchLower = graphSearch.toLowerCase();
      for (const p of posArr) {
        const n = p.node;
        const radius = Math.max(6, Math.min(20, 4 + n.caseCount * 2));
        const baseColor = entityTypeColor(n.entityType);
        const color =
          showClusters && n.clusterId != null
            ? CLUSTER_COLORS[n.clusterId % CLUSTER_COLORS.length] ?? baseColor
            : baseColor;
        const isSearchMatch =
          searchLower.length > 0 &&
          (n.label.toLowerCase().includes(searchLower) ||
            n.id.toLowerCase().includes(searchLower));

        // Search highlight glow
        if (isSearchMatch) {
          ctx.save();
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius + 6, 0, 2 * Math.PI);
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        }

        // Cluster ring
        if (showClusters && n.clusterId != null) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius + 4, 0, 2 * Math.PI);
          ctx.strokeStyle =
            CLUSTER_COLORS[n.clusterId % CLUSTER_COLORS.length] ?? "#6b7280";
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Risk border
        if (n.riskScore > 70) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius + 3, 0, 2 * Math.PI);
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        // Campaign membership indicator (small diamond)
        if (showCampaigns && n.campaignIds && n.campaignIds.length > 0) {
          const dx = radius + 5;
          const dy = -(radius + 2);
          ctx.save();
          ctx.translate(p.x + dx, p.y + dy);
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = "#3b82f6";
          ctx.fillRect(-4, -4, 8, 8);
          ctx.restore();
        }

        // Label
        ctx.fillStyle = "#1e293b";
        ctx.font = "10px Inter, sans-serif";
        ctx.textAlign = "center";
        const label =
          n.label.length > 16 ? n.label.slice(0, 14) + "…" : n.label;
        ctx.fillText(label, p.x, p.y + radius + 12);
      }

      ctx.restore();
    }

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [
    graphData,
    positions,
    scale,
    showClusters,
    showCampaigns,
    hoveredEdge,
    graphSearch,
  ]);

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / scale;
      const my = (e.clientY - rect.top) / scale;

      // Node hover tooltip
      for (const p of positions.values()) {
        const dx = p.x - mx;
        const dy = p.y - my;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          setHoveredNode(p.node);
          setHoveredEdge(null);
          setTooltipPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
          // Also check cluster hover
          if (showClusters && p.node.clusterId != null && graphData?.clusters) {
            const cluster = graphData.clusters.find(
              (c) => c.clusterId === p.node.clusterId,
            );
            if (cluster) {
              setHoveredCluster(cluster);
              return;
            }
          }
          setHoveredCluster(null);
          return;
        }
      }

      // Edge hover tooltip
      if (graphData) {
        for (const edge of graphData.edges) {
          const a = positions.get(edge.source);
          const b = positions.get(edge.target);
          if (!a || !b) continue;
          const edx = b.x - a.x;
          const edy = b.y - a.y;
          const lenSq = edx * edx + edy * edy;
          if (lenSq === 0) continue;
          const t = Math.max(
            0,
            Math.min(1, ((mx - a.x) * edx + (my - a.y) * edy) / lenSq),
          );
          const px = a.x + t * edx;
          const py = a.y + t * edy;
          const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
          if (dist < 8) {
            setHoveredEdge(edge);
            setHoveredNode(null);
            setHoveredCluster(null);
            setTooltipPos({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            });
            return;
          }
        }
      }

      setHoveredNode(null);
      setHoveredEdge(null);
      setHoveredCluster(null);
    },
    [showClusters, graphData, positions, scale],
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !graphData) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / scale;
      const my = (e.clientY - rect.top) / scale;

      // Check node hit first
      for (const p of positions.values()) {
        const dx = p.x - mx;
        const dy = p.y - my;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          setSelectedNode(p.node);
          setSelectedEdge(null);
          return;
        }
      }

      // Check edge hit (point-to-line-segment distance)
      for (const edge of graphData.edges) {
        const a = positions.get(edge.source);
        const b = positions.get(edge.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) continue;
        const t = Math.max(
          0,
          Math.min(1, ((mx - a.x) * dx + (my - a.y) * dy) / lenSq),
        );
        const px = a.x + t * dx;
        const py = a.y + t * dy;
        const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
        if (dist < 8) {
          setSelectedEdge(edge);
          setSelectedNode(null);
          return;
        }
      }

      setSelectedNode(null);
      setSelectedEdge(null);
    },
    [positions, scale, graphData],
  );

  const handleExport = useCallback(async () => {
    if (!seed) return;
    const res = await fetch(
      `/api/intelligence/graph/export?seed=${encodeURIComponent(seed)}&fmt=png`,
    );
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `graph-${seed}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, [seed]);

  const handleZoomToFit = useCallback(() => {
    if (positions.size === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of positions.values()) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    const padding = 40;
    const graphW = maxX - minX + padding * 2;
    const graphH = maxY - minY + padding * 2;
    const newScale = Math.min(canvas.width / graphW, canvas.height / graphH, 3);
    setScale(Math.max(newScale, 0.3));
  }, [positions]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {/* Controls sidebar */}
      <Card className="p-4 lg:col-span-1">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Graph Controls
          </h3>
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            title="What am I looking at?"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label
              htmlFor="seed-entity-type"
              className="block text-xs text-slate-500"
            >
              Entity Type
            </label>
            <select
              id="seed-entity-type"
              value={seedType}
              onChange={(e) => setSeedType(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
            >
              {entityTypes.length === 0 && <option value="">Loading…</option>}
              {entityTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500">Entity Value</label>
            <div className="mt-1 flex gap-1">
              <Input
                value={seedValue}
                onChange={(e) => setSeedValue(e.target.value)}
                placeholder="Enter value…"
                className="flex-1 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchGraph();
                }}
              />
              <Button
                size="sm"
                onClick={fetchGraph}
                disabled={loading || !seed}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500">Hops</label>
            <select
              value={hops}
              onChange={(e) => setHops(Number(e.target.value))}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
            >
              <option value={1}>1 hop</option>
              <option value={2}>2 hops</option>
              <option value={3}>3 hops</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setScale((s) => Math.min(s + 0.2, 3))}
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setScale((s) => Math.max(s - 0.2, 0.3))}
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleZoomToFit}
              title="Zoom to fit"
            >
              <Crosshair className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
          {graphData?.clusters && graphData.clusters.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={showClusters}
                  onChange={(e) => setShowClusters(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Show Communities
              </label>
            </div>
          )}
          {graphData &&
            graphData.nodes.some(
              (n) => n.campaignIds && n.campaignIds.length > 0,
            ) && (
              <div>
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={showCampaigns}
                    onChange={(e) => setShowCampaigns(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Show Campaign Membership
                </label>
              </div>
            )}
          {/* Search within graph */}
          {graphData && graphData.nodes.length > 0 && (
            <div>
              <label className="block text-xs text-slate-500">
                Search Graph
              </label>
              <Input
                value={graphSearch}
                onChange={(e) => setGraphSearch(e.target.value)}
                placeholder="Highlight node…"
                className="mt-1 text-sm"
              />
            </div>
          )}
        </div>
        {/* Legend — derived from current graph nodes */}
        <div className="mt-4 space-y-1">
          <p className="text-xs font-semibold text-slate-500">Entity Types</p>
          {graphData
            ? Array.from(new Set(graphData.nodes.map((n) => n.entityType)))
                .sort()
                .map((t) => (
                  <div key={t} className="flex items-center gap-2 text-xs">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: entityTypeColor(t) }}
                    />
                    {entityTypeLabel(t)}
                  </div>
                ))
            : entityTypes.map(({ value, label }) => (
                <div key={value} className="flex items-center gap-2 text-xs">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: entityTypeColor(value) }}
                  />
                  {label}
                </div>
              ))}
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Edge Types
          </p>
          {(graphData
            ? Array.from(new Set(graphData.edges.map((e) => e.edgeType)))
                .sort()
                .map(
                  (type) =>
                    [type, EDGE_COLORS[type] || EDGE_COLORS.default] as const,
                )
            : Object.entries(EDGE_COLORS).filter(([k]) => k !== "default")
          ).map(([type, color]) => (
            <div
              key={type}
              className="flex items-center gap-2 text-xs"
              title={EDGE_DESCRIPTIONS[type] ?? ""}
            >
              <span
                className="inline-block h-[2px] w-3"
                style={{ backgroundColor: color }}
              />
              {type}
            </div>
          ))}
        </div>
      </Card>

      {/* Graph canvas */}
      <Card className="relative lg:col-span-3">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-slate-900/60">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600" />
          </div>
        )}
        {error && (
          <div className="flex h-96 items-center justify-center text-red-500">
            {error}
          </div>
        )}
        {!graphData && !loading && !error && (
          <div className="flex h-96 items-center justify-center text-slate-400">
            Enter a seed entity and click search to explore the network graph.
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          className="w-full cursor-crosshair"
        />
        {hoveredCluster && (
          <div
            className="pointer-events-none absolute z-20 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800"
            style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 10 }}
          >
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              Community {hoveredCluster.clusterId}
            </p>
            <div className="mt-1 space-y-0.5 text-xs text-slate-500">
              <p>{hoveredCluster.nodeCount} nodes</p>
              <p>Primary: {hoveredCluster.primaryEntityType}</p>
              <p>{hoveredCluster.totalCases} total cases</p>
              <p>Avg risk: {hoveredCluster.avgRiskScore.toFixed(1)}</p>
            </div>
          </div>
        )}
        {hoveredNode && !hoveredCluster && (
          <div
            className="pointer-events-none absolute z-20 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800"
            style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 10 }}
          >
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              {hoveredNode.label}
            </p>
            <div className="mt-1 space-y-0.5 text-xs text-slate-500">
              <p>{entityTypeLabel(hoveredNode.entityType)}</p>
              <p>
                {hoveredNode.caseCount} case
                {hoveredNode.caseCount !== 1 ? "s" : ""}
              </p>
              {hoveredNode.riskScore > 0 && (
                <p>Risk: {hoveredNode.riskScore.toFixed(1)}</p>
              )}
            </div>
          </div>
        )}
        {hoveredEdge && !hoveredNode && !hoveredCluster && (
          <div
            className="pointer-events-none absolute z-20 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800"
            style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 10 }}
          >
            <p className="text-xs font-semibold text-slate-900 dark:text-white">
              {hoveredEdge.weight} shared case
              {hoveredEdge.weight !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-slate-500">
              {EDGE_DESCRIPTIONS[hoveredEdge.edgeType] ?? hoveredEdge.edgeType}
            </p>
          </div>
        )}
        {graphData && (
          <div className="absolute bottom-2 left-2 text-xs text-slate-400">
            {graphData.nodeCount} nodes · {graphData.edgeCount} edges
          </div>
        )}
        {/* Minimap */}
        {graphData && positions.size > 0 && (
          <MiniMap positions={positions} edges={graphData.edges} />
        )}
      </Card>

      {/* Node detail panel */}
      {selectedNode && (
        <Card className="p-4 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{selectedNode.label}</h3>
              <Badge variant="default" title={selectedNode.entityType}>
                {entityTypeLabel(selectedNode.entityType)}
              </Badge>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Case Count</p>
              <p className="font-semibold">{selectedNode.caseCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Risk Score</p>
              <p className="font-semibold">{selectedNode.riskScore}</p>
            </div>
            {selectedNode.campaignIds &&
              selectedNode.campaignIds.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500">Campaigns</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.campaignIds.map((cid) => (
                      <Link key={cid} href={`/intelligence/campaigns/${cid}`}>
                        <Badge
                          variant="default"
                          className="cursor-pointer text-blue-600 hover:bg-blue-100"
                        >
                          {cid.length > 12
                            ? cid.slice(0, 6) + "…" + cid.slice(-4)
                            : cid}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  const parts = selectedNode.id.split(":", 2);
                  if (parts.length === 2) {
                    setSeedType(parts[0]!);
                    setSeedValue(parts[1]!);
                  }
                  fetchGraph();
                }}
              >
                <Maximize2 className="mr-1 h-3 w-3" /> Expand
              </Button>
              <Link
                href={`/intelligence/entities?entity_type=${encodeURIComponent(selectedNode.entityType)}`}
              >
                <Button size="sm" variant="secondary">
                  <ExternalLink className="mr-1 h-3 w-3" /> View Entity
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Edge detail panel */}
      {selectedEdge && (
        <Card className="p-4 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              Edge: {selectedEdge.source.split(":")[1]} &harr;{" "}
              {selectedEdge.target.split(":")[1]}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedEdge(null)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {EDGE_DESCRIPTIONS[selectedEdge.edgeType] ??
              `Relationship type: ${selectedEdge.edgeType}`}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Shared Cases</p>
              <p className="font-semibold">{selectedEdge.weight}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Edge Type</p>
              <Badge variant="default">{selectedEdge.edgeType}</Badge>
            </div>
          </div>
          {selectedEdge.caseIds && selectedEdge.caseIds.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-slate-500">
                Linked Cases
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {selectedEdge.caseIds.map((cid) => (
                  <Link key={cid} href={`/cases/${cid}`}>
                    <Badge
                      variant="default"
                      className="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      {cid.length > 16
                        ? cid.slice(0, 6) + "…" + cid.slice(-6)
                        : cid}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Help modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Understanding the Network Graph
              </h2>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-400">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Nodes
                </h3>
                <p>
                  Each circle represents an <strong>entity</strong> extracted
                  from fraud complaint cases — wallet addresses, phone numbers,
                  email addresses, organizations, people, URLs, and more. Node
                  size is proportional to the number of cases mentioning that
                  entity.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Edges
                </h3>
                <p>
                  Lines between nodes indicate a <strong>co-occurrence</strong>{" "}
                  — both entities appear in the same fraud case. Thicker lines
                  mean more shared cases. Click an edge to see which specific
                  cases link two entities.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Organizations
                </h3>
                <p>
                  Organization nodes represent business or group names mentioned
                  in case narratives. These may be{" "}
                  <strong>
                    legitimate businesses impersonated by scammers
                  </strong>{" "}
                  (e.g., a victim says &quot;they claimed to be from XYZ
                  Corp&quot;) or actual scam organizations.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Communities
                </h3>
                <p>
                  When enabled, colored rings group tightly connected entities
                  detected by community analysis. These clusters often represent
                  a single fraud operation using multiple identifiers.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Risk Indicators
                </h3>
                <p>
                  Nodes with a red border have a risk score above 70, indicating
                  high-risk entities based on case severity and frequency.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button size="sm" onClick={() => setShowHelp(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MiniMap — small overview of the full graph in the corner
// ---------------------------------------------------------------------------

function MiniMap({
  positions,
  edges,
}: {
  positions: Map<string, NodePosition>;
  edges: GraphEdge[];
}) {
  const miniRef = useRef<HTMLCanvasElement>(null);
  const W = 160;
  const H = 120;

  useEffect(() => {
    const canvas = miniRef.current;
    if (!canvas || positions.size === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of positions.values()) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    const pad = 10;
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const sx = (W - pad * 2) / rangeX;
    const sy = (H - pad * 2) / rangeY;
    const s = Math.min(sx, sy);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#e2e8f0";
    ctx.strokeRect(0, 0, W, H);

    // Edges
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 0.5;
    for (const edge of edges) {
      const a = positions.get(edge.source);
      const b = positions.get(edge.target);
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(pad + (a.x - minX) * s, pad + (a.y - minY) * s);
      ctx.lineTo(pad + (b.x - minX) * s, pad + (b.y - minY) * s);
      ctx.stroke();
    }

    // Nodes
    for (const p of positions.values()) {
      const nx = pad + (p.x - minX) * s;
      const ny = pad + (p.y - minY) * s;
      ctx.beginPath();
      ctx.arc(nx, ny, 2, 0, 2 * Math.PI);
      ctx.fillStyle = entityTypeColor(p.node.entityType);
      ctx.fill();
    }
  }, [positions, edges]);

  return (
    <canvas
      ref={miniRef}
      width={W}
      height={H}
      className="absolute bottom-2 right-2 rounded border border-slate-200 shadow-sm"
    />
  );
}

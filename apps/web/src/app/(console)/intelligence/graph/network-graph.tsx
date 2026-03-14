"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, Button, Input, Badge } from "@i4g/ui-kit";
import type { GraphPayload, GraphNode } from "@i4g/sdk";
import { Download, Maximize2, Search, ZoomIn, ZoomOut } from "lucide-react";

const ENTITY_COLORS: Record<string, string> = {
  wallet: "#ef4444",
  email: "#3b82f6",
  phone: "#10b981",
  ip: "#f59e0b",
  domain: "#8b5cf6",
  url: "#ec4899",
  default: "#6b7280",
};

const EDGE_COLORS: Record<string, string> = {
  "co-occurrence": "#94a3b8",
  "shared-ip": "#f97316",
  "same-campaign": "#3b82f6",
  default: "#cbd5e1",
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<GraphPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seed, setSeed] = useState("");
  const [hops, setHops] = useState(1);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [positions, setPositions] = useState<Map<string, NodePosition>>(
    new Map(),
  );
  const [scale, setScale] = useState(1);
  const animRef = useRef<number | null>(null);

  const fetchGraph = useCallback(async () => {
    if (!seed) return;
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        seed,
        hops: String(hops),
        seed_type: "entity",
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
  }, [seed, hops]);

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
      }

      // Draw nodes
      for (const p of posArr) {
        const n = p.node;
        const radius = Math.max(6, Math.min(20, 4 + n.caseCount * 2));
        const color = ENTITY_COLORS[n.entityType] ?? ENTITY_COLORS["default"]!;

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
  }, [graphData, positions, scale]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / scale;
      const my = (e.clientY - rect.top) / scale;

      for (const p of positions.values()) {
        const dx = p.x - mx;
        const dy = p.y - my;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          setSelectedNode(p.node);
          return;
        }
      }
      setSelectedNode(null);
    },
    [positions, scale],
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

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {/* Controls sidebar */}
      <Card className="p-4 lg:col-span-1">
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          Graph Controls
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500">Seed Entity</label>
            <div className="mt-1 flex gap-1">
              <Input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="entity_type:value"
                className="flex-1 text-sm"
              />
              <Button size="sm" onClick={fetchGraph} disabled={loading}>
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
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setScale((s) => Math.max(s - 0.2, 0.3))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Legend */}
        <div className="mt-4 space-y-1">
          <p className="text-xs font-semibold text-slate-500">Entity Types</p>
          {Object.entries(ENTITY_COLORS)
            .filter(([k]) => k !== "default")
            .map(([type, color]) => (
              <div key={type} className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block h-3 w-3 rounded-full"
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
          className="w-full cursor-crosshair"
        />
        {graphData && (
          <div className="absolute bottom-2 left-2 text-xs text-slate-400">
            {graphData.nodeCount} nodes · {graphData.edgeCount} edges
          </div>
        )}
      </Card>

      {/* Detail panel */}
      {selectedNode && (
        <Card className="p-4 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{selectedNode.label}</h3>
            <Badge variant="default">{selectedNode.entityType}</Badge>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500">Case Count</p>
              <p className="font-semibold">{selectedNode.caseCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Risk Score</p>
              <p className="font-semibold">{selectedNode.riskScore}</p>
            </div>
            <div>
              <Button
                size="sm"
                onClick={() => {
                  setSeed(selectedNode.id);
                  fetchGraph();
                }}
              >
                <Maximize2 className="mr-1 h-3 w-3" /> Expand
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

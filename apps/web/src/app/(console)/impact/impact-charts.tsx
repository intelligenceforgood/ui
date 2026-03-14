"use client";

import { Card } from "@i4g/ui-kit";
import type {
  TaxonomyLossItem,
  DetectionVelocityPoint,
  PipelineFunnelStage,
  CumulativeIndicatorPoint,
} from "@i4g/sdk";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const palette = {
  primary: "#0ea5e9",
  secondary: "#14b8a6",
  accent: "#f97316",
  warning: "#eab308",
  purple: "#8b5cf6",
};

interface ImpactChartsProps {
  lossByTaxonomy: TaxonomyLossItem[];
  velocity: DetectionVelocityPoint[];
  funnel: PipelineFunnelStage[];
  cumulative: CumulativeIndicatorPoint[];
}

function LossTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TaxonomyLossItem }>;
}) {
  if (!active || !payload?.[0]) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md dark:border-slate-700 dark:bg-slate-900">
      <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
      {item.code && (
        <p className="font-mono text-xs text-slate-400">{item.code}</p>
      )}
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        ${item.lossSum.toLocaleString()}
      </p>
    </div>
  );
}

export default function ImpactCharts({
  lossByTaxonomy,
  velocity,
  funnel,
  cumulative,
}: ImpactChartsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
      {/* Loss by Taxonomy (Treemap-style bar) */}
      <Card className="flex h-60 flex-col sm:h-80">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Loss by fraud type
          </h2>
          <p className="text-xs text-slate-400">USD</p>
        </div>
        <div className="mt-4 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lossByTaxonomy} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={120}
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                content={<LossTooltipContent />}
                cursor={{ fill: "rgba(148,163,184,0.1)" }}
              />
              <Bar
                dataKey="lossSum"
                fill={palette.accent}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Detection Velocity */}
      <Card className="flex h-60 flex-col sm:h-80">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Detection velocity
          </h2>
          <p className="text-xs text-slate-400">Proactive vs Reactive</p>
        </div>
        <div className="mt-4 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={velocity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="period"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                width={40}
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="proactive"
                stroke={palette.primary}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="reactive"
                stroke={palette.accent}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Pipeline Funnel */}
      <Card className="flex h-60 flex-col sm:h-80">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Pipeline funnel
          </h2>
          <p className="text-xs text-slate-400">Intake → Action</p>
        </div>
        <div className="mt-4 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="stage"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip />
              <Bar
                dataKey="count"
                fill={palette.purple}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Cumulative Indicators (stacked area) */}
      <Card className="flex h-60 flex-col sm:h-80">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Cumulative indicators
          </h2>
          <p className="text-xs text-slate-400">Stacked by category</p>
        </div>
        <div className="mt-4 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulative}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="period"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                width={40}
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="bank"
                stackId="1"
                stroke={palette.primary}
                fill={palette.primary}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="crypto"
                stackId="1"
                stroke={palette.secondary}
                fill={palette.secondary}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="domain"
                stackId="1"
                stroke={palette.accent}
                fill={palette.accent}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="ip"
                stackId="1"
                stroke={palette.warning}
                fill={palette.warning}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="other"
                stackId="1"
                stroke={palette.purple}
                fill={palette.purple}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </section>
  );
}

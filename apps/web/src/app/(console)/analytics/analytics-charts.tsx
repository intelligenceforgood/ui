"use client";

import { Card } from "@i4g/ui-kit";
import type { AnalyticsOverview } from "@i4g/sdk";
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
  neutral: "#94a3b8",
};

type AnalyticsChartsProps = {
  data: AnalyticsOverview;
};

export default function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <Card className="flex h-80 flex-col">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Detection rate
          </h2>
          <p className="text-xs text-slate-400">Daily model performance</p>
        </div>
        <div className="mt-4 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.detectionRateSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
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
              <Tooltip cursor={{ stroke: palette.primary, strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={palette.primary}
                strokeWidth={3}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="flex h-80 flex-col">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Pipeline throughput
          </h2>
          <p className="text-xs text-slate-400">Signals processed per stage</p>
        </div>
        <div className="mt-4 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.pipelineBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
              />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip />
              <Bar
                dataKey="value"
                fill={palette.secondary}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="flex h-80 flex-col">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Weekly incidents vs interventions
          </h2>
          <p className="text-xs text-slate-400">Program outcomes</p>
        </div>
        <div className="mt-4 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.weeklyIncidents}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="week"
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
                dataKey="incidents"
                stroke={palette.primary}
                fill={palette.primary}
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="interventions"
                stroke={palette.accent}
                fill={palette.accent}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="flex h-80 flex-col">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Geography coverage
          </h2>
          <p className="text-xs text-slate-400">Incidents detected by region</p>
        </div>
        <div className="mt-4 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.geographyBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="region"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                width={120}
              />
              <Tooltip />
              <Bar
                dataKey="value"
                fill={palette.neutral}
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </section>
  );
}

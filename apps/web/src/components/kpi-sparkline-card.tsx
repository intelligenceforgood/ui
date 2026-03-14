"use client";

import { Card, Badge } from "@i4g/ui-kit";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface KpiSparklineCardProps {
  label: string;
  value: string | number;
  unit?: string | null;
  change?: string | null;
  sparklineData?: Array<{ v: number }>;
}

function trendIcon(change: string | null | undefined): ReactNode {
  if (!change) return <Activity className="h-3 w-3" />;
  if (change.startsWith("+")) return <TrendingUp className="h-3 w-3" />;
  if (change.startsWith("-")) return <TrendingDown className="h-3 w-3" />;
  return <Activity className="h-3 w-3" />;
}

function trendColor(
  change: string | null | undefined,
): "success" | "danger" | "default" {
  if (!change) return "default";
  if (change.startsWith("+")) return "success";
  if (change.startsWith("-")) return "danger";
  return "default";
}

export function KpiSparklineCard({
  label,
  value,
  unit,
  change,
  sparklineData,
}: KpiSparklineCardProps) {
  return (
    <Card className="relative space-y-1 overflow-hidden p-3 sm:p-4">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-slate-500 sm:text-sm">
          {label}
        </span>
        <Badge variant={trendColor(change)} className="gap-1 text-xs">
          {trendIcon(change)}
          <span className="hidden sm:inline">{change ?? "—"}</span>
        </Badge>
      </div>
      <p className="text-2xl font-semibold text-slate-900 sm:text-3xl">
        {value}
        {unit ? (
          <span className="ml-1 text-sm text-slate-400 sm:text-base">
            {unit}
          </span>
        ) : null}
      </p>
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-1 h-8 w-full sm:hidden">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <Area
                type="monotone"
                dataKey="v"
                stroke="#0ea5e9"
                fill="#0ea5e9"
                fillOpacity={0.15}
                strokeWidth={1.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

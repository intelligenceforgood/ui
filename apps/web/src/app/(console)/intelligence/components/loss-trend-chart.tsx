"use client";

import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";

interface LossTrendChartProps {
  data: { period: string; loss: number }[];
}

export function LossTrendChart({ data }: LossTrendChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-slate-500">No data available</div>;
  }
  return (
    <div className="h-16 w-full mt-2 -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Tooltip
            contentStyle={{ fontSize: "12px", borderRadius: "4px" }}
            formatter={(value: number) => [
              `$${value.toLocaleString()}`,
              "Loss",
            ]}
            labelStyle={{ color: "black" }}
            itemStyle={{ color: "black" }}
          />
          <Area
            type="monotone"
            dataKey="loss"
            stroke="#f59e0b"
            fill="#fef3c7"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

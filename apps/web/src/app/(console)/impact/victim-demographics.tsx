"use client";

import { Card } from "@i4g/ui-kit";
import type {
  VictimAnalyticsResponse,
  VictimDemographicBreakdown,
} from "@i4g/sdk";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const palette = [
  "#0ea5e9", // primary
  "#14b8a6", // secondary
  "#f97316", // accent
  "#eab308", // warning
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#10b981", // emerald
];

interface VictimDemographicsProps {
  data: VictimAnalyticsResponse;
}

function DemographicTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: VictimDemographicBreakdown }>;
}) {
  if (!active || !payload?.[0]) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md dark:border-slate-700 dark:bg-slate-900">
      <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
      <p className="mt-1 text-slate-600 dark:text-slate-300">
        Victims: {item.count.toLocaleString()} ({item.percentage}%)
      </p>
      {item.lossSum > 0 && (
        <p className="text-slate-600 dark:text-slate-300">
          Loss: ${item.lossSum.toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default function VictimDemographics({ data }: VictimDemographicsProps) {
  // Take top 5 countries and aggregate the rest as "Other" to avoid too many slices
  const topCountries = data.byCountry.slice(0, 5);
  if (data.byCountry.length > 5) {
    const otherCount = data.byCountry
      .slice(5)
      .reduce((acc, curr) => acc + curr.count, 0);
    const otherLoss = data.byCountry
      .slice(5)
      .reduce((acc, curr) => acc + curr.lossSum, 0);
    const otherPercentage = data.byCountry
      .slice(5)
      .reduce((acc, curr) => acc + curr.percentage, 0);
    topCountries.push({
      label: "Other",
      count: otherCount,
      lossSum: otherLoss,
      percentage: Number(otherPercentage.toFixed(1)),
    });
  }

  return (
    <section className="grid gap-4 sm:grid-cols-1 xl:grid-cols-3">
      {/* Age Range */}
      <Card className="flex h-60 flex-col sm:h-80">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Victims by age
          </h2>
          <p className="text-xs text-slate-400">Total: {data.totalVictims}</p>
        </div>
        <div className="mt-4 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.byAgeRange}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="count"
              >
                {data.byAgeRange.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={palette[index % palette.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<DemographicTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Country */}
      <Card className="flex h-60 flex-col sm:h-80">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Victims by country
          </h2>
          <p className="text-xs text-slate-400">Top 5</p>
        </div>
        <div className="mt-4 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={topCountries}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="count"
              >
                {topCountries.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={palette[index % palette.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<DemographicTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Contact Channel */}
      <Card className="flex h-60 flex-col sm:h-80">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Contact channels
          </h2>
          <p className="text-xs text-slate-400">First contact</p>
        </div>
        <div className="mt-4 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.byContactChannel}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="count"
              >
                {data.byContactChannel.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={palette[index % palette.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<DemographicTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </section>
  );
}

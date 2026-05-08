import * as React from "react";
import { Card } from "./card";
import { clsx as cn } from "clsx";

export interface KpiCardProps extends React.ComponentProps<typeof Card> {
  label: string;
  value: React.ReactNode;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  sparkline?: React.ReactNode; // Optional sparkline component
}

export function KpiCard({
  label,
  value,
  change,
  changeType = "neutral",
  sparkline,
  className,
  ...props
}: KpiCardProps) {
  return (
    <Card className={cn("flex flex-col p-6", className)} {...props}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-4 flex items-end justify-between">
        <p className="text-3xl font-semibold text-slate-900">{value}</p>
        {sparkline && <div className="h-10 w-24">{sparkline}</div>}
      </div>
      {change && (
        <p
          className={cn("mt-2 text-xs", {
            "text-teal-600": changeType === "positive",
            "text-rose-600": changeType === "negative",
            "text-slate-400": changeType === "neutral",
          })}
        >
          {change}
        </p>
      )}
    </Card>
  );
}

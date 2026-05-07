import { clsx } from "clsx";
import type { HTMLAttributes, ReactNode } from "react";
import { Card } from "../card";

export type StatsCardProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
};

export function StatsCard({
  title,
  value,
  icon,
  trend,
  className,
  ...props
}: StatsCardProps) {
  return (
    <Card className={clsx("flex flex-col gap-2", className)} {...props}>
      <div className="flex items-center justify-between text-sm font-medium text-slate-500">
        <h3>{title}</h3>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-semibold text-slate-900">{value}</div>
        {trend && (
          <div
            className={clsx(
              "text-sm font-medium",
              trend.isPositive ? "text-emerald-600" : "text-rose-600",
            )}
          >
            {trend.isPositive ? "+" : "-"}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </Card>
  );
}

"use client";

import { Badge } from "@i4g/ui-kit";

const STATUS_STYLES: Record<
  string,
  { variant: "success" | "warning" | "danger" | "default"; label: string }
> = {
  active: { variant: "success", label: "Active" },
  dormant: { variant: "default", label: "Dormant" },
  flagged: { variant: "warning", label: "Flagged" },
  taken_down: { variant: "danger", label: "Taken Down" },
};

interface EntityStatusBadgeProps {
  status: string;
  className?: string;
}

export function EntityStatusBadge({
  status,
  className,
}: EntityStatusBadgeProps) {
  const config = STATUS_STYLES[status] ?? {
    variant: "default" as const,
    label: status,
  };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

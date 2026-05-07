import { clsx } from "clsx";
import type { HTMLAttributes } from "react";
import { Card } from "../card";

export type ThreatActor = {
  name: string;
  aliases: string[];
  target_brands?: string[];
  domains: string[];
  stolen_amount: number;
  status: "active" | "inactive";
};

export type ThreatActorTableProps = HTMLAttributes<HTMLDivElement> & {
  data: ThreatActor[];
};

export function ThreatActorTable({
  data,
  className,
  ...props
}: ThreatActorTableProps) {
  return (
    <Card
      className={clsx("overflow-hidden p-0", className)}
      padded={false}
      {...props}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-6 py-4 font-medium">Actor Name</th>
              <th className="px-6 py-4 font-medium">Aliases</th>
              <th className="px-6 py-4 font-medium">Target Brands</th>
              <th className="px-6 py-4 font-medium">Associated Domains</th>
              <th className="px-6 py-4 font-medium text-right">
                Financial Damage
              </th>
              <th className="px-6 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.map((actor, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-medium text-slate-900">
                  {actor.name}
                </td>
                <td className="px-6 py-4">
                  {actor.aliases.length > 0 ? actor.aliases.join(", ") : "-"}
                </td>
                <td className="px-6 py-4">
                  {actor.target_brands && actor.target_brands.length > 0
                    ? actor.target_brands.join(", ")
                    : "-"}
                </td>
                <td className="px-6 py-4">
                  {actor.domains.length > 0 ? actor.domains.join(", ") : "-"}
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  ${actor.stolen_amount.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={clsx(
                      "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                      actor.status === "active"
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                        : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/10",
                    )}
                  >
                    {actor.status}
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-slate-500"
                >
                  No threat actors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

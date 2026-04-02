"use client";

import { Card } from "@i4g/ui-kit";
import type { CampaignTimelinePoint, GraphPayload } from "@i4g/sdk";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface CampaignTimelineProps {
  timeline: CampaignTimelinePoint[];
  graph: GraphPayload;
  entityTypes: string[];
}

export default function CampaignTimeline({
  timeline,
  graph,
  entityTypes,
}: CampaignTimelineProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <Card className="flex h-72 flex-col p-4">
        <h2 className="text-lg font-semibold text-slate-900">Case timeline</h2>
        <p className="text-xs text-slate-400">Cases per day</p>
        <div className="mt-2 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="caseCount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="flex h-72 flex-col p-4">
        <h2 className="text-lg font-semibold text-slate-900">Entity network</h2>
        <p className="text-xs text-slate-400">
          {graph.nodes.length} nodes, {graph.edges.length} edges
        </p>
        <div className="mt-4 space-y-3 overflow-y-auto">
          {entityTypes.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">
                Entity Types
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {entityTypes.map((t) => (
                  <span
                    key={t}
                    className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase text-slate-400">
              Top nodes
            </p>
            <ul className="mt-1 space-y-1 text-sm text-slate-600">
              {graph.nodes.slice(0, 10).map((node) => (
                <li key={node.id} className="flex justify-between">
                  <span>
                    {node.label}{" "}
                    <span className="text-xs text-slate-400">
                      ({node.entityType})
                    </span>
                  </span>
                  <span className="text-slate-400">{node.caseCount} cases</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Card } from "@i4g/ui-kit";
import { Users } from "lucide-react";
import type { ActorListResponse, ThreatActorRow } from "@/types/actors";

export default function CampaignActors({ campaignId }: { campaignId: string }) {
  const [actors, setActors] = useState<ThreatActorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActors = async () => {
      try {
        const params = new URLSearchParams({
          campaign_id: campaignId,
          limit: "10",
        });
        const res = await fetch(`/api/actors?${params}`);
        if (!res.ok) throw new Error("Failed to load actors");
        const data: ActorListResponse = await res.json();
        setActors(data.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    };
    fetchActors();
  }, [campaignId]);

  return (
    <div className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Users className="h-5 w-5 text-slate-500" />
        Linked Actors
      </h2>

      {loading && <p className="text-sm text-slate-500">Loading actors...</p>}
      {!loading && error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && actors.length === 0 && (
        <Card className="p-8 text-center border-dashed">
          <Users className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-600">No actors found</p>
          <p className="text-xs text-slate-500 mt-1">
            No threat actors have been linked to this campaign.
          </p>
        </Card>
      )}

      {!loading && !error && actors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actors.map((actor) => (
            <Card
              key={actor.actorId}
              className="p-4 flex items-center justify-between hover:shadow-md transition"
            >
              <div>
                <Link
                  href={`/actors/${actor.actorId}`}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  {actor.displayName}
                </Link>
                <div className="flex gap-2 mt-1">
                  {actor.role && <Badge variant="default">{actor.role}</Badge>}
                  {actor.confidence && (
                    <span className="text-xs text-slate-500">
                      {(actor.confidence * 100).toFixed(0)}% conf
                    </span>
                  )}
                </div>
              </div>
              {actor.realName ? (
                <Badge variant="warning" className="text-xs">
                  PII available
                </Badge>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && actors.length > 0 && (
        <div className="text-right">
          <Link
            href={`/actors?campaignFilter=${campaignId}`}
            className="text-sm text-blue-600 hover:underline"
          >
            View all actors →
          </Link>
        </div>
      )}
    </div>
  );
}

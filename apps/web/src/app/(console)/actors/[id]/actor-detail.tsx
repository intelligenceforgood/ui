"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card } from "@i4g/ui-kit";
import type { ActorDetailResponse } from "@/types/actors";

export default function ActorDetail({ actorId }: { actorId: string }) {
  const [data, setData] = useState<ActorDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PII unlock state
  const [piiReason, setPiiReason] = useState("");
  const [isPiiUnlocked, setIsPiiUnlocked] = useState(false);
  const [piiModalOpen, setPiiModalOpen] = useState(false);

  const fetchActor = useCallback(
    async (reason?: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (reason) params.set("reason", reason);
        const res = await fetch(`/api/actors/${actorId}?${params}`);

        if (!res.ok) {
          if (res.status === 400 && res.statusText.includes("Reason")) {
            throw new Error("Reason code required for PII access");
          }
          throw new Error(`HTTP ${res.status}`);
        }

        const json: ActorDetailResponse = await res.json();
        setData(json);
        if (reason) setIsPiiUnlocked(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load actor");
      } finally {
        setLoading(false);
      }
    },
    [actorId],
  );

  useEffect(() => {
    fetchActor();
  }, [fetchActor]);

  const handleUnlockPii = async () => {
    if (!piiReason) return;
    setPiiModalOpen(false);
    await fetchActor(piiReason);
  };

  if (loading && !data)
    return <p className="text-sm text-slate-500">Loading actor profile...</p>;
  if (error && !data)
    return <div className="text-red-600 bg-red-50 p-4 rounded">{error}</div>;
  if (!data) return null;

  const {
    actor,
    identities,
    edges,
    leaks,
    chats,
    damage,
    brands,
    linkedCampaigns,
  } = data;

  return (
    <div className="space-y-8">
      {/* Header & Identity Panel */}
      <Card className="p-6 relative overflow-hidden">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              {actor.displayName}
              {actor.role && <Badge variant="default">{actor.role}</Badge>}
              {actor.confidence && (
                <Badge>{(actor.confidence * 100).toFixed(0)}% Confidence</Badge>
              )}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
              <div>
                <span className="text-slate-500 font-semibold block mb-1">
                  Real Name (PII)
                </span>
                {actor.realName ? (
                  <span className="text-amber-600 font-medium">
                    {actor.realName}{" "}
                    <Badge variant="default" className="ml-2 text-xs">
                      PII — Audited
                    </Badge>
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Redacted</span>
                )}
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1">
                  First Seen
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {actor.firstSeenAt
                    ? new Date(actor.firstSeenAt).toLocaleString()
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1">
                  Linked Campaigns
                </span>
                <div className="flex gap-2 mt-1">
                  {linkedCampaigns.length > 0
                    ? linkedCampaigns.map((c) => (
                        <Badge key={c} variant="default">
                          {c}
                        </Badge>
                      ))
                    : "—"}
                </div>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1">
                  Brand Impersonations
                </span>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {brands.length > 0
                    ? brands.map((b, i) => (
                        <Badge key={i} variant="default">
                          {b.brand || "Unknown"}
                        </Badge>
                      ))
                    : "—"}
                </div>
              </div>
            </div>
          </div>
          <div>
            {!isPiiUnlocked && (
              <Button onClick={() => setPiiModalOpen(true)} variant="secondary">
                Unlock PII
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* PII Modal */}
      {piiModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              Unlock PII (Audited Access)
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Access to real names, cleartext passwords, and full chat
              transcripts is restricted and logged. Please provide a reason for
              this access.
            </p>
            <input
              type="text"
              value={piiReason}
              onChange={(e) => setPiiReason(e.target.value)}
              placeholder="e.g. Case #1234 investigation"
              className="w-full border rounded p-2 mb-4 dark:bg-slate-800 dark:border-slate-700"
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setPiiModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleUnlockPii}
                disabled={!piiReason}
              >
                Confirm & Unlock
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identities List */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200">
            Digital Identities
          </h3>
          <ul className="space-y-3">
            {identities.map((id) => (
              <li
                key={id.identityId}
                className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded"
              >
                <div>
                  <span className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400">
                    {id.handle}
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    on {id.platform}
                  </span>
                </div>
              </li>
            ))}
            {identities.length === 0 && (
              <p className="text-sm text-slate-500">No identities found.</p>
            )}
          </ul>
        </Card>

        {/* Leaks */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200">
            Leak Indicators
          </h3>
          <ul className="space-y-3">
            {leaks.map((leak) => (
              <li
                key={leak.leakId}
                className="p-3 bg-red-50 dark:bg-red-900/10 rounded border border-red-100 dark:border-red-900/30"
              >
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-red-800 dark:text-red-400">
                    {leak.sourceBreach}
                  </span>
                  <span className="text-xs text-slate-500">
                    {leak.email || "—"}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  Password:{" "}
                  {leak.passwordCleartext ? (
                    <span className="font-mono text-amber-600">
                      {leak.passwordCleartext}
                    </span>
                  ) : (
                    <span className="italic text-slate-400">Redacted</span>
                  )}
                </div>
              </li>
            ))}
            {leaks.length === 0 && (
              <p className="text-sm text-slate-500">No leak records.</p>
            )}
          </ul>
        </Card>

        {/* Financial Damage Ledger */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200">
            Financial Damage Ledger
          </h3>
          <ul className="space-y-3">
            {damage.map((d, i) => (
              <li
                key={i}
                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded flex justify-between"
              >
                <span className="text-sm">{d.currency || "USD"}</span>
                <span className="text-sm font-mono text-red-600">
                  {(d.claimed_amount || 0).toLocaleString()} claimed
                </span>
              </li>
            ))}
            {damage.length === 0 && (
              <p className="text-sm text-slate-500">
                No financial damage recorded.
              </p>
            )}
          </ul>
        </Card>

        {/* Chat Sessions */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200">
            Top Chat Sessions
          </h3>
          <ul className="space-y-3">
            {chats.map((chat, i) => (
              <li
                key={chat.sessionId || i}
                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded"
              >
                <div className="text-xs text-slate-500 mb-2">
                  Session ID: {chat.sessionId}
                </div>
                {chat.transcript ? (
                  <pre className="text-xs p-2 bg-white dark:bg-slate-900 border rounded overflow-x-auto max-h-32">
                    {chat.transcript}
                  </pre>
                ) : (
                  <span className="italic text-slate-400 text-sm">
                    Transcript Redacted
                  </span>
                )}
              </li>
            ))}
            {chats.length === 0 && (
              <p className="text-sm text-slate-500">No chat sessions.</p>
            )}
          </ul>
        </Card>

        {/* Co-membership Graph Placeholder */}
        <Card className="p-6 md:col-span-2">
          <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200">
            Co-membership Graph
          </h3>
          <div className="bg-slate-50 dark:bg-slate-900 border rounded h-64 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Simple circular layout rendering of nodes and edges */}
            <svg width="100%" height="100%">
              {edges.map((e, i) => {
                // A very crude mock visualization just to show relationships
                return (
                  <line
                    key={i}
                    x1="20%"
                    y1="50%"
                    x2="80%"
                    y2="50%"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="4"
                  />
                );
              })}
              {identities.map((id, i) => (
                <circle
                  key={id.identityId}
                  cx={`${20 + i * 20}%`}
                  cy="50%"
                  r="15"
                  fill="#3b82f6"
                />
              ))}
            </svg>
            {identities.length === 0 && (
              <span className="text-sm text-slate-400 absolute">
                Graph requires identities and edges.
              </span>
            )}
            <div className="absolute bottom-4 left-4 text-xs text-slate-500 bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded">
              {identities.length} nodes, {edges.length} edges
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

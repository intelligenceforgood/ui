"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Search,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { Badge, Card, FeedbackButton } from "@i4g/ui-kit";
import type {
  EcxFeedRecord,
  EcxFeedResponse,
  EcxPollingState,
  EcxPollingStatusResponse,
} from "@/types/ssi";

const MODULES = [
  { value: "phish", label: "Phishing" },
  { value: "malicious-domain", label: "Malicious Domains" },
  { value: "malicious-ip", label: "Malicious IPs" },
  { value: "cryptocurrency-addresses", label: "Crypto Addresses" },
] as const;

type FeedModule = (typeof MODULES)[number]["value"];

export default function EcxFeedPage() {
  const [module, setModule] = useState<FeedModule>("phish");
  const [confidenceMin, setConfidenceMin] = useState(0);
  const [brand, setBrand] = useState("");
  const [records, setRecords] = useState<EcxFeedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pollingStates, setPollingStates] = useState<EcxPollingState[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ module, limit: "50" });
      if (confidenceMin > 0)
        params.set("confidence_min", String(confidenceMin));
      if (brand.trim()) params.set("brand", brand.trim());

      const res = await fetch(`/api/ssi/ecx/feed?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(body.detail ?? `HTTP ${res.status}`);
      }
      const data: EcxFeedResponse = await res.json();
      setRecords(data.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, [module, confidenceMin, brand]);

  const fetchPollingStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/ssi/ecx/polling-status");
      if (res.ok) {
        const data: EcxPollingStatusResponse = await res.json();
        setPollingStates(data.modules);
      }
    } catch (err) {
      console.warn("[ecx-feed] Failed to fetch polling status:", err);
    }
  }, []);

  useEffect(() => {
    void fetchFeed();
    void fetchPollingStatus();
  }, [fetchFeed, fetchPollingStatus]);

  const handleInvestigate = async (record: EcxFeedRecord) => {
    const url = record.url ?? record.domain ?? record.site_link;
    if (!url) return;

    try {
      const res = await fetch("/api/ssi/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.startsWith("http") ? url : `https://${url}`,
          scan_type: "full",
          push_to_core: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        window.open(`/ssi/investigations/${data.investigation_id}`, "_blank");
      }
    } catch (err) {
      console.error("[ecx-feed] Investigation request failed:", err);
    }
  };

  const currentPolling = pollingStates.find((s) => s.module === module);

  return (
    <div className="group relative space-y-6">
      <FeedbackButton
        feedbackId="ssi-ecx-feed.page"
        className="absolute top-1 right-0 z-10"
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">eCX Intelligence Feed</h1>
          <p className="text-sm text-slate-500">
            Community threat intelligence from APWG eCrimeX.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchFeed()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Polling status banner */}
      {currentPolling && (
        <div className="flex items-center gap-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-800">
          <Zap className="h-4 w-4" />
          <span>
            Last polled:{" "}
            {currentPolling.last_polled_at
              ? new Date(currentPolling.last_polled_at).toLocaleString()
              : "never"}
            {" · "}Records found: {currentPolling.records_found}
            {currentPolling.errors > 0 && (
              <span className="text-amber-600">
                {" "}
                · Errors: {currentPolling.errors}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label
              htmlFor="ecx-module"
              className="block text-xs font-medium text-slate-600"
            >
              Module
            </label>
            <select
              id="ecx-module"
              value={module}
              onChange={(e) => setModule(e.target.value as FeedModule)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {MODULES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="ecx-confidence"
              className="block text-xs font-medium text-slate-600"
            >
              Min Confidence
            </label>
            <input
              id="ecx-confidence"
              type="number"
              min={0}
              max={100}
              value={confidenceMin}
              onChange={(e) => setConfidenceMin(Number(e.target.value))}
              className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="ecx-brand"
              className="block text-xs font-medium text-slate-600"
            >
              Brand
            </label>
            <input
              id="ecx-brand"
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Filter by brand..."
              className="w-48 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => void fetchFeed()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Results */}
      {!loading && records.length === 0 && !error && (
        <div className="py-12 text-center text-sm text-slate-400">
          No records found. Try adjusting your filters.
        </div>
      )}

      <div className="grid gap-3">
        {records.map((record) => (
          <FeedRecordCard
            key={record.id}
            record={record}
            module={module}
            onInvestigate={handleInvestigate}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feed record card
// ---------------------------------------------------------------------------

function FeedRecordCard({
  record,
  module,
  onInvestigate,
}: {
  record: EcxFeedRecord;
  module: string;
  onInvestigate: (record: EcxFeedRecord) => void;
}) {
  const primary =
    record.url ?? record.domain ?? record.ip ?? record.address ?? "—";
  const confidence = record.confidence ?? 0;
  const discoveredTs = record.discovered_at
    ? new Date(record.discovered_at * 1000).toLocaleString()
    : null;

  const confidenceColor =
    confidence >= 80
      ? "bg-red-100 text-red-800"
      : confidence >= 50
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-100 text-slate-800";

  const canInvestigate =
    module === "phish" ||
    module === "malicious-domain" ||
    Boolean(record.site_link);

  return (
    <Card className="flex items-start justify-between gap-4 p-4 transition hover:shadow-md">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-slate-400" />
          <span
            className="truncate font-mono text-sm font-medium"
            title={primary}
          >
            {primary}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {record.brand && <Badge variant="info">{record.brand}</Badge>}
          {record.currency && <Badge variant="info">{record.currency}</Badge>}
          {record.classification && (
            <Badge variant="info">{record.classification}</Badge>
          )}
          {record.crime_category && (
            <Badge variant="info">{record.crime_category}</Badge>
          )}
          {record.tld && <span>TLD: .{record.tld}</span>}
          {discoveredTs && <span>Discovered: {discoveredTs}</span>}
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${confidenceColor}`}
          >
            {confidence}% confidence
          </span>
          <span className="text-slate-400">eCX #{record.id}</span>
        </div>
      </div>

      {canInvestigate && (
        <button
          type="button"
          onClick={() => onInvestigate(record)}
          className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          Investigate
        </button>
      )}
    </Card>
  );
}

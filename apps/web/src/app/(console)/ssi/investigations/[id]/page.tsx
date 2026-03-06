"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge, Card, FeedbackButton } from "@i4g/ui-kit";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Globe,
  Lock,
  MapPin,
  Monitor,
  Radio,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Wallet,
  XCircle,
} from "lucide-react";
import { useInvestigationMonitor } from "@/lib/use-investigation-monitor";
import type {
  EcxApproveRequest,
  EcxSubmission,
  EcxSubmissionsResponse,
  GuidanceCommand,
  InvestigationDetailResponse,
  PIIExposure,
  SSIEvent,
  SSIEventType,
  WalletRecord,
} from "@/types/ssi";

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type TabId = "recon" | "monitor" | "results";

const TABS: Array<{ id: TabId; label: string; icon: typeof Shield }> = [
  { id: "recon", label: "Recon", icon: Globe },
  { id: "monitor", label: "Live Monitor", icon: Radio },
  { id: "results", label: "Results", icon: ShieldCheck },
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

import { formatDate, parseUTCDate } from "@/lib/format";

function riskVariant(
  score: number | null | undefined,
): "danger" | "warning" | "default" {
  if (score == null) return "default";
  if (score >= 70) return "danger";
  if (score >= 40) return "warning";
  return "default";
}

// ---------------------------------------------------------------------------
// Recon Tab
// ---------------------------------------------------------------------------

/** True when every own value is null, undefined, empty string, or an empty array. */
function isEmptyRecord(rec: Record<string, unknown>): boolean {
  return Object.values(rec).every(
    (v) => v == null || v === "" || (Array.isArray(v) && v.length === 0),
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-sm italic text-slate-400 dark:text-slate-500">
      {message}
    </p>
  );
}

function ReconTab({ data }: { data: InvestigationDetailResponse }) {
  const passive = (data.scan.passive_result ?? {}) as Record<string, unknown>;
  const whois = (passive.whois ?? {}) as Record<string, unknown>;
  const dns = (passive.dns ?? {}) as Record<string, unknown>;
  const ssl = (passive.ssl ?? {}) as Record<string, unknown>;
  const geoip = (passive.geoip ?? {}) as Record<string, unknown>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-blue-500" />
          WHOIS
        </h3>
        {isEmptyRecord(whois) ? (
          <EmptyState message="No WHOIS data found. Domain may be unregistered or privacy-protected." />
        ) : (
          <dl className="space-y-2 text-sm">
            <InfoRow label="Domain" value={whois.domain} />
            <InfoRow label="Registrar" value={whois.registrar} />
            <InfoRow label="Created" value={whois.creation_date} />
            <InfoRow label="Expires" value={whois.expiration_date} />
            <InfoRow label="Country" value={whois.registrant_country} />
            <InfoRow label="Registrant" value={whois.registrant_name} />
            <InfoRow label="Organization" value={whois.registrant_org} />
            {Array.isArray(whois.name_servers) &&
              whois.name_servers.length > 0 && (
                <InfoRow
                  label="Name servers"
                  value={(whois.name_servers as string[]).join(", ")}
                />
              )}
          </dl>
        )}
      </Card>

      {/* DNS */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Server className="w-4 h-4 text-purple-500" />
          DNS Records
        </h3>
        {isEmptyRecord(dns) ? (
          <EmptyState message="No DNS records found. Domain may be unregistered or offline." />
        ) : (
          <dl className="space-y-2 text-sm">
            {Array.isArray(dns.a) && (
              <InfoRow label="A" value={(dns.a as string[]).join(", ")} />
            )}
            {Array.isArray(dns.aaaa) && (
              <InfoRow label="AAAA" value={(dns.aaaa as string[]).join(", ")} />
            )}
            {Array.isArray(dns.mx) && (
              <InfoRow
                label="MX"
                value={(dns.mx as Array<Record<string, unknown>>)
                  .map((r) => String(r.value ?? r))
                  .join(", ")}
              />
            )}
            {Array.isArray(dns.ns) && (
              <InfoRow label="NS" value={(dns.ns as string[]).join(", ")} />
            )}
            {Array.isArray(dns.txt) && (
              <InfoRow label="TXT" value={(dns.txt as string[]).join("; ")} />
            )}
          </dl>
        )}
      </Card>

      {/* SSL */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-emerald-500" />
          SSL Certificate
        </h3>
        {isEmptyRecord(ssl) ? (
          <EmptyState message="No SSL certificate found. Host may not support HTTPS or is unreachable." />
        ) : (
          <dl className="space-y-2 text-sm">
            <InfoRow label="Issuer" value={ssl.issuer} />
            <InfoRow label="Subject" value={ssl.subject} />
            <InfoRow label="Valid from" value={ssl.not_before} />
            <InfoRow label="Valid to" value={ssl.not_after} />
            <InfoRow
              label="Self-signed"
              value={
                ssl.self_signed === true
                  ? "Yes"
                  : ssl.self_signed === false
                    ? "No"
                    : undefined
              }
            />
            {Array.isArray(ssl.sans) && (
              <InfoRow label="SANs" value={(ssl.sans as string[]).join(", ")} />
            )}
          </dl>
        )}
      </Card>

      {/* GeoIP */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-rose-500" />
          GeoIP
        </h3>
        {isEmptyRecord(geoip) ? (
          <EmptyState message="Unable to resolve host to an IP address." />
        ) : (
          <dl className="space-y-2 text-sm">
            <InfoRow label="IP" value={geoip.ip} />
            <InfoRow label="Hostname" value={geoip.hostname} />
            <InfoRow label="City" value={geoip.city} />
            <InfoRow label="Region" value={geoip.region} />
            <InfoRow label="Country" value={geoip.country} />
            <InfoRow label="Organization" value={geoip.org} />
            <InfoRow label="ASN" value={geoip.asn} />
          </dl>
        )}
      </Card>

      {/* eCrimeX Intelligence */}
      <EcxEnrichmentPanel scanId={data.scan.scan_id} />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: unknown }) {
  if (value == null || value === "" || value === undefined) return null;
  return (
    <div className="flex gap-2">
      <dt className="w-28 flex-shrink-0 text-slate-500 dark:text-slate-400 font-medium">
        {label}
      </dt>
      <dd className="text-slate-800 dark:text-slate-200 break-all">
        {String(value)}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Replay Panel — shown when a scan has already completed
// ---------------------------------------------------------------------------

interface SsiEventRecord {
  id: string;
  scan_id: string;
  event_type: string;
  timestamp: string;
  data: Record<string, unknown> | null;
  screenshot_url: string | null;
  created_at: string;
}

interface SsiEventsListResponse {
  scanId: string;
  items: SsiEventRecord[];
  count: number;
}

function ReplayPanel({ scanId }: { scanId: string }) {
  const [events, setEvents] = useState<SsiEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/events/ssi/${scanId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as SsiEventsListResponse;
        if (!cancelled) setEvents(json.items ?? []);
      } catch (err) {
        if (!cancelled)
          setFetchError(
            err instanceof Error ? err.message : "Failed to load replay",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scanId]);

  // Find the last screenshot event so we can render a final frame.
  const lastScreenshot = [...events]
    .reverse()
    .find(
      (e) =>
        e.event_type === "screenshot_update" &&
        typeof (e.data as Record<string, unknown> | null)?.screenshot_b64 ===
          "string",
    );
  const screenshotB64 = lastScreenshot
    ? ((lastScreenshot.data as Record<string, unknown>)
        .screenshot_b64 as string)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        Loading event replay…
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-red-500">
        {fetchError}
      </div>
    );
  }

  const ssiEvents: SSIEvent[] = events.map((e) => ({
    event_type: e.event_type as SSIEventType,
    timestamp: e.timestamp,
    investigation_id: e.scan_id,
    data: (e.data as Record<string, unknown>) ?? {},
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Final screenshot */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            Final Screenshot
          </span>
          <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            replay
          </Badge>
        </div>
        <Card className="overflow-hidden bg-slate-900">
          {screenshotB64 ? (
            /* eslint-disable-next-line @next/next/no-img-element -- base64 data URI from DB replay; next/image does not support data URIs */
            <img
              src={`data:image/jpeg;base64,${screenshotB64}`}
              alt="Final screenshot from investigation replay"
              className="w-full h-auto"
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
              No screenshot captured
            </div>
          )}
        </Card>
      </div>

      {/* Replayed event log */}
      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Event Replay ({ssiEvents.length})
          </h4>
          <div className="max-h-[30rem] overflow-y-auto space-y-1.5">
            {ssiEvents.length === 0 && (
              <p className="text-xs text-slate-400 italic">
                No events recorded for this scan.
              </p>
            )}
            {ssiEvents
              .slice()
              .reverse()
              .map((evt, i) => (
                <EventRow key={i} event={evt} />
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live Monitor Tab
// ---------------------------------------------------------------------------

/**
 * Renders the live WS/SSE view.  Kept separate from LiveMonitorTab so that
 * the `useInvestigationMonitor` hook (which opens a connection) is only
 * mounted for in-progress scans.
 */
function LiveMonitorContent({ investigationId }: { investigationId: string }) {
  const {
    state: wsState,
    screenshot,
    events,
    snapshot,
    sendGuidance,
    reconnect,
  } = useInvestigationMonitor({
    investigationId,
    guidance: true,
  });

  const [guidanceAction, setGuidanceAction] = useState<string>("click");
  const [guidanceValue, setGuidanceValue] = useState("");
  const [guidanceReason, setGuidanceReason] = useState("");

  function handleSendGuidance() {
    sendGuidance({
      action: guidanceAction as GuidanceCommand["action"],
      value: guidanceValue || undefined,
      reason: guidanceReason || undefined,
    });
    setGuidanceValue("");
    setGuidanceReason("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Screenshot panel */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Live View
            </span>
            <Badge
              className={
                wsState === "connected"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : wsState === "connecting"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
              }
            >
              {wsState}
            </Badge>
          </div>
          {wsState !== "connected" && (
            <button
              onClick={reconnect}
              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              Reconnect
            </button>
          )}
        </div>

        <Card className="overflow-hidden bg-slate-900">
          {screenshot ? (
            /* eslint-disable-next-line @next/next/no-img-element -- base64 data URI from WebSocket; next/image does not support data URIs */
            <img
              src={`data:image/png;base64,${screenshot}`}
              alt="Live screenshot of investigation"
              className="w-full h-auto"
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
              {wsState === "connected"
                ? "Waiting for screenshot…"
                : "Connect to see live view"}
            </div>
          )}
        </Card>

        {snapshot?.state && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              State:{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {snapshot.state}
              </strong>
            </span>
            {snapshot.url && (
              <>
                <span>·</span>
                <span className="truncate">{snapshot.url}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Event log + guidance */}
      <div className="space-y-4">
        {/* Guidance input */}
        <Card className="p-4 space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Send Guidance
          </h4>
          {wsState !== "connected" && (
            <p className="text-xs text-slate-400 italic">
              Connect to a live investigation to send guidance commands.
            </p>
          )}
          <select
            value={guidanceAction}
            onChange={(e) => setGuidanceAction(e.target.value)}
            disabled={wsState !== "connected"}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="click">Click</option>
            <option value="type">Type</option>
            <option value="goto">Go to URL</option>
            <option value="skip">Skip</option>
            <option value="continue">Continue</option>
          </select>
          {(guidanceAction === "click" ||
            guidanceAction === "type" ||
            guidanceAction === "goto") && (
            <input
              value={guidanceValue}
              onChange={(e) => setGuidanceValue(e.target.value)}
              disabled={wsState !== "connected"}
              placeholder={
                guidanceAction === "click"
                  ? "CSS selector"
                  : guidanceAction === "goto"
                    ? "https://..."
                    : "selector|text"
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          )}
          <input
            value={guidanceReason}
            onChange={(e) => setGuidanceReason(e.target.value)}
            disabled={wsState !== "connected"}
            placeholder="Reason (optional)"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            onClick={handleSendGuidance}
            disabled={wsState !== "connected"}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </Card>

        {/* Event log */}
        <Card className="p-4">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Event Log ({events.length})
          </h4>
          <div className="max-h-96 overflow-y-auto space-y-1.5">
            {events.length === 0 && (
              <p className="text-xs text-slate-400 italic">No events yet</p>
            )}
            {events
              .slice()
              .reverse()
              .map((evt, i) => (
                <EventRow key={i} event={evt} />
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Thin router: shows event replay for completed/failed scans and the live
 * monitor for all other statuses.
 */
function LiveMonitorTab({
  investigationId,
  scanStatus,
}: {
  investigationId: string;
  scanStatus: string;
}) {
  if (scanStatus === "completed" || scanStatus === "failed") {
    return <ReplayPanel scanId={investigationId} />;
  }
  return <LiveMonitorContent investigationId={investigationId} />;
}

function EventRow({ event }: { event: SSIEvent }) {
  const colorMap: Record<string, string> = {
    state_changed: "text-blue-600 dark:text-blue-400",
    wallet_found: "text-emerald-600 dark:text-emerald-400",
    error: "text-red-600 dark:text-red-400",
    guidance_needed: "text-amber-600 dark:text-amber-400",
    site_completed: "text-emerald-600 dark:text-emerald-400",
    screenshot_update: "text-slate-500",
    action_executed: "text-purple-600 dark:text-purple-400",
  };
  const color = colorMap[event.event_type] ?? "text-slate-500";

  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-slate-400 flex-shrink-0 w-14">
        {parseUTCDate(event.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </span>
      <span className={`font-medium ${color}`}>
        {event.event_type.replace(/_/g, " ")}
      </span>
      {event.data.message != null && (
        <span className="text-slate-500 dark:text-slate-400 truncate">
          {String(event.data.message as string)}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results Tab
// ---------------------------------------------------------------------------

// eCX submission status display helpers
const ECX_STATUS_CLASS: Record<string, string> = {
  submitted:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  updated:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  queued: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  pending: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  failed: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  rejected: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  retracted:
    "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const ECX_MODULE_LABEL: Record<string, string> = {
  phish: "Phish URL",
  "malicious-domain": "Domain",
  "malicious-ip": "IP",
  "report-phishing": "Report",
  "cryptocurrency-addresses": "Wallet",
};

// ---------------------------------------------------------------------------
// eCrimeX Enrichment Panel — shows intelligence hits FROM eCrimeX
// ---------------------------------------------------------------------------

interface EcxEnrichmentRow {
  enrichment_id: string;
  query_module: string;
  query_value: string;
  ecx_record_id: number | null;
  confidence: number | null;
  ecx_data: Record<string, unknown>;
}

interface EcxEnrichmentResponse {
  scan_id: string;
  count: number;
  enrichments: EcxEnrichmentRow[];
}

function EcxEnrichmentPanel({ scanId }: { scanId: string }) {
  const [enrichments, setEnrichments] = useState<EcxEnrichmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ssi/ecx/investigate/${encodeURIComponent(scanId)}`)
      .then((r) => r.json())
      .then((data: EcxEnrichmentResponse) => {
        if (!cancelled) setEnrichments(data.enrichments ?? []);
      })
      .catch(() => {
        /* silently ignore — panel stays empty */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scanId]);

  const hits = enrichments.filter((e) => e.ecx_record_id != null);

  return (
    <Card className="p-5 md:col-span-2">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        <ShieldAlert className="w-4 h-4 text-red-500" />
        eCrimeX Intelligence ({loading ? "…" : hits.length} hit
        {hits.length !== 1 ? "s" : ""})
      </h3>
      {loading ? (
        <p className="text-sm text-slate-400 italic">Loading…</p>
      ) : hits.length === 0 ? (
        <p className="text-sm italic text-slate-400 dark:text-slate-500">
          No matching records found in eCrimeX for this investigation.
        </p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <th className="pb-2 pr-4 font-medium">Module</th>
              <th className="pb-2 pr-4 font-medium">Value</th>
              <th className="pb-2 pr-4 font-medium">Classification</th>
              <th className="pb-2 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {hits.map((row) => {
              const classification =
                (row.ecx_data.classification as string) ?? "—";
              const confidence = row.confidence ?? 0;
              return (
                <tr key={row.enrichment_id}>
                  <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">
                    {ECX_MODULE_LABEL[row.query_module] ?? row.query_module}
                  </td>
                  <td className="py-2 pr-4 font-mono text-slate-800 dark:text-slate-200 break-all">
                    {row.query_value}
                  </td>
                  <td className="py-2 pr-4 capitalize text-slate-800 dark:text-slate-200">
                    {classification}
                  </td>
                  <td className="py-2">
                    <Badge
                      variant={
                        confidence >= 80
                          ? "danger"
                          : confidence >= 50
                            ? "warning"
                            : "default"
                      }
                    >
                      {confidence}%
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function EcxSubmissionsPanel({ scanId }: { scanId: string }) {
  const [submissions, setSubmissions] = useState<EcxSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [analystInput, setAnalystInput] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/ssi/ecx/submissions?scan_id=${encodeURIComponent(scanId)}&limit=50`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as EcxSubmissionsResponse;
      setSubmissions(json.submissions ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load submissions",
      );
    } finally {
      setLoading(false);
    }
  }, [scanId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleApprove(sub: EcxSubmission) {
    const analyst = analystInput[sub.submission_id] ?? "";
    if (!analyst.trim()) {
      alert("Enter your analyst identifier before approving.");
      return;
    }
    setActingOn(sub.submission_id);
    try {
      const body: EcxApproveRequest = {
        analyst: analyst.trim(),
        release_label: sub.release_label ?? "",
      };
      const res = await fetch(
        `/api/ssi/ecx/submissions/${sub.submission_id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const msg = (await res.json()) as { detail?: string };
        throw new Error(msg.detail ?? `HTTP ${res.status}`);
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setActingOn(null);
    }
  }

  async function handleReject(sub: EcxSubmission) {
    const analyst = analystInput[sub.submission_id] ?? "";
    if (!analyst.trim()) {
      alert("Enter your analyst identifier before rejecting.");
      return;
    }
    setActingOn(sub.submission_id);
    try {
      const res = await fetch(
        `/api/ssi/ecx/submissions/${sub.submission_id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analyst: analyst.trim() }),
        },
      );
      if (!res.ok) {
        const msg = (await res.json()) as { detail?: string };
        throw new Error(msg.detail ?? `HTTP ${res.status}`);
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setActingOn(null);
    }
  }

  async function handleRetract(sub: EcxSubmission) {
    const analyst = analystInput[sub.submission_id] ?? "";
    if (!analyst.trim()) {
      alert("Enter your analyst identifier before retracting.");
      return;
    }
    if (
      !confirm(
        `Retract submission for "${sub.submitted_value}" from eCrimeX? This cannot be undone.`,
      )
    ) {
      return;
    }
    setActingOn(sub.submission_id);
    try {
      const res = await fetch(
        `/api/ssi/ecx/submissions/${sub.submission_id}/retract`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analyst: analyst.trim() }),
        },
      );
      if (!res.ok) {
        const msg = (await res.json()) as { detail?: string };
        throw new Error(msg.detail ?? `HTTP ${res.status}`);
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retract failed");
    } finally {
      setActingOn(null);
    }
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        <Upload className="w-4 h-4 text-indigo-500" />
        eCrimeX Submissions ({submissions.length})
      </h3>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 italic">
          No eCrimeX submissions for this investigation. Submissions are created
          automatically after investigation completes (when ECX is enabled and
          the data-sharing agreement is signed).
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="pb-2 pr-3">Module</th>
                <th className="pb-2 pr-3">Value</th>
                <th className="pb-2 pr-3">Confidence</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3">eCX ID</th>
                <th className="pb-2 pr-3">Submitted at</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {submissions.map((sub) => {
                const isQueued = sub.status === "queued";
                const isSubmitted = sub.status === "submitted";
                const isBusy = actingOn === sub.submission_id;
                return (
                  <tr key={sub.submission_id}>
                    <td className="py-2 pr-3 font-medium text-slate-700 dark:text-slate-300">
                      {ECX_MODULE_LABEL[sub.ecx_module] ?? sub.ecx_module}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-slate-600 dark:text-slate-400 break-all max-w-[14rem]">
                      {sub.submitted_value}
                    </td>
                    <td className="py-2 pr-3 text-slate-600 dark:text-slate-400">
                      {sub.confidence}%
                    </td>
                    <td className="py-2 pr-3">
                      <Badge
                        className={
                          ECX_STATUS_CLASS[sub.status] ??
                          ECX_STATUS_CLASS.pending
                        }
                      >
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 text-slate-600 dark:text-slate-400">
                      {sub.ecx_record_id ?? "—"}
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {sub.submitted_at
                        ? new Date(sub.submitted_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-2">
                      {isQueued || isSubmitted ? (
                        <div className="flex flex-col gap-1.5">
                          <input
                            value={analystInput[sub.submission_id] ?? ""}
                            onChange={(e) =>
                              setAnalystInput((prev) => ({
                                ...prev,
                                [sub.submission_id]: e.target.value,
                              }))
                            }
                            placeholder="Analyst ID"
                            className="w-28 rounded border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          />
                          <div className="flex gap-1">
                            {isQueued && (
                              <>
                                <button
                                  onClick={() => void handleApprove(sub)}
                                  disabled={isBusy}
                                  className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => void handleReject(sub)}
                                  disabled={isBusy}
                                  className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                                >
                                  <XCircle className="w-3 h-3" />
                                  Reject
                                </button>
                              </>
                            )}
                            {isSubmitted && (
                              <button
                                onClick={() => void handleRetract(sub)}
                                disabled={isBusy}
                                className="inline-flex items-center gap-1 rounded bg-slate-600 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-500 disabled:opacity-50"
                              >
                                <XCircle className="w-3 h-3" />
                                Retract
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {sub.submitted_by ? `by ${sub.submitted_by}` : "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ResultsTab({ data }: { data: InvestigationDetailResponse }) {
  const scan = data.scan;
  const classification = scan.classification_result;
  const wallets = data.wallets;
  const piiExposures = data.piiExposures;

  return (
    <div className="space-y-6">
      {/* Risk score + classification */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-blue-500" />
            Risk Assessment
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Risk Score
              </span>
              <Badge variant={riskVariant(scan.risk_score)}>
                {scan.risk_score != null
                  ? `${Math.round(scan.risk_score)} / 100`
                  : "N/A"}
              </Badge>
            </div>
            {classification?.scam_type && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Classification
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {classification.scam_type}
                </p>
                {classification.summary && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {classification.summary}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Evidence downloads */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Download className="w-4 h-4 text-emerald-500" />
            Evidence
          </h3>
          <div className="space-y-3">
            {scan.evidence_path && (
              <a
                href={`/api/ssi/report/${scan.scan_id}`}
                download
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Download className="w-4 h-4" />
                Download PDF Report
              </a>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Scan ID: {scan.scan_id}
            </p>
          </div>
        </Card>
      </div>

      {/* Wallets table */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Wallet className="w-4 h-4 text-amber-500" />
          Harvested Wallets ({wallets.length})
        </h3>
        {wallets.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            No wallets extracted in this investigation.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="pb-2 pr-4">Token</th>
                  <th className="pb-2 pr-4">Network</th>
                  <th className="pb-2 pr-4">Address</th>
                  <th className="pb-2 pr-4">Source</th>
                  <th className="pb-2">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {wallets.map((w: WalletRecord) => (
                  <tr key={w.wallet_id}>
                    <td className="py-2 pr-4 font-semibold text-slate-800 dark:text-slate-200">
                      {w.token_symbol}
                    </td>
                    <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">
                      {w.network_short}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-slate-700 dark:text-slate-300 break-all">
                      {w.wallet_address}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge>{w.source ?? "—"}</Badge>
                    </td>
                    <td className="py-2 text-slate-600 dark:text-slate-400">
                      {w.confidence != null
                        ? `${(w.confidence * 100).toFixed(0)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* PII Exposures */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Eye className="w-4 h-4 text-rose-500" />
          PII Exposure ({piiExposures.length})
        </h3>
        {piiExposures.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            No PII exposure data recorded.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="pb-2 pr-4">Field Type</th>
                  <th className="pb-2 pr-4">Label</th>
                  <th className="pb-2 pr-4">Required</th>
                  <th className="pb-2">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {piiExposures.map((p: PIIExposure) => (
                  <tr key={p.exposure_id}>
                    <td className="py-2 pr-4 font-semibold text-slate-800 dark:text-slate-200">
                      {p.field_type}
                    </td>
                    <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">
                      {p.field_label ?? "—"}
                    </td>
                    <td className="py-2 pr-4">
                      {p.is_required ? (
                        <Badge variant="warning">Required</Badge>
                      ) : (
                        <Badge>Optional</Badge>
                      )}
                    </td>
                    <td className="py-2">
                      {p.was_submitted ? (
                        <Badge variant="danger">Yes</Badge>
                      ) : (
                        <Badge>No</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* eCrimeX Submissions */}
      <EcxSubmissionsPanel scanId={scan.scan_id} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function InvestigationDetailPage() {
  const params = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabId>("recon");
  const [data, setData] = useState<InvestigationDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/ssi/investigations/${params.id}`);
      if (!res.ok) {
        setError(
          res.status === 404
            ? "Investigation not found."
            : "Failed to load investigation.",
        );
        return;
      }
      const json = (await res.json()) as InvestigationDetailResponse;
      setData(json);
      setError(null);
    } catch {
      setError("Failed to connect to SSI service.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-96 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-10 w-28 rounded-lg bg-slate-200 dark:bg-slate-700"
            />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-52 rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/ssi/investigations"
          className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Investigations
        </Link>
        <Card className="p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">
            {error ?? "Investigation not found."}
          </p>
        </Card>
      </div>
    );
  }

  const scan = data.scan;
  const domain = scan.domain ?? "Unknown";

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <Link
          href="/ssi/investigations"
          className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Investigations
        </Link>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-3">
              <Globe className="w-6 h-6 text-blue-500" />
              {domain}
              <Badge
                className={
                  scan.status === "completed"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : scan.status === "failed"
                      ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                      : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                }
              >
                {scan.status}
              </Badge>
            </h1>
            <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(scan.created_at)}
              </span>
              <span className="truncate">{scan.url}</span>
            </div>
          </div>
          {scan.risk_score != null && (
            <Badge
              variant={riskVariant(scan.risk_score)}
              className="text-lg px-4 py-2"
            >
              Risk: {Math.round(scan.risk_score)} / 100
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
              activeTab === id
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {id === "results" && data.wallets.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                {data.wallets.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "recon" && (
        <div className="group relative">
          <FeedbackButton
            feedbackId="ssi-detail.recon"
            className="absolute top-2 right-2 z-10"
          />
          <ReconTab data={data} />
        </div>
      )}
      {activeTab === "monitor" && (
        <div className="group relative">
          <FeedbackButton
            feedbackId="ssi-detail.monitor"
            className="absolute top-2 right-2 z-10"
          />
          <LiveMonitorTab
            investigationId={scan.scan_id}
            scanStatus={scan.status}
          />
        </div>
      )}
      {activeTab === "results" && (
        <div className="group relative">
          <FeedbackButton
            feedbackId="ssi-detail.results"
            className="absolute top-2 right-2 z-10"
          />
          <ResultsTab data={data} />
        </div>
      )}
    </div>
  );
}

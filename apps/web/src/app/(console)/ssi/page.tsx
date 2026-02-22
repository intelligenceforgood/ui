"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileSearch,
  Globe,
  Loader2,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Zap,
} from "lucide-react";
import { SectionLabel } from "@i4g/ui-kit";
import type {
  InvestigateResponse,
  InvestigationResult,
  ScanType,
  StatusResponse,
} from "@/types/ssi";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 3_000;
const MAX_POLLS = 200;

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function RiskBadge({ score }: { score: number }) {
  const level = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  const styles = {
    high: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    medium:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    low: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  };
  const icons = {
    high: <ShieldAlert className="w-5 h-5" />,
    medium: <AlertTriangle className="w-5 h-5" />,
    low: <ShieldCheck className="w-5 h-5" />,
  };
  const labels = { high: "High Risk", medium: "Medium Risk", low: "Low Risk" };

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${styles[level]}`}
    >
      {icons[level]}
      <span>
        {Math.round(score)}/100 — {labels[level]}
      </span>
    </div>
  );
}

interface StepProps {
  label: string;
  state: "pending" | "active" | "done" | "error";
}

function Step({ label, state }: StepProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
        {state === "done" && (
          <span className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </span>
        )}
        {state === "active" && (
          <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </span>
        )}
        {state === "error" && (
          <span className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <XCircle className="w-5 h-5 text-white" />
          </span>
        )}
        {state === "pending" && (
          <span className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <Clock className="w-4 h-4 text-slate-400" />
          </span>
        )}
      </div>
      <span
        className={`text-sm font-medium ${
          state === "active"
            ? "text-blue-700 dark:text-blue-300"
            : state === "done"
              ? "text-emerald-700 dark:text-emerald-300"
              : state === "error"
                ? "text-red-700 dark:text-red-300"
                : "text-slate-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        danger
          ? "bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800"
          : "bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700"
      }`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-wide mb-1 ${
          danger ? "text-red-500" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <p
        className={`text-sm font-semibold truncate ${
          danger
            ? "text-red-700 dark:text-red-300"
            : "text-slate-800 dark:text-slate-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scan type selector
// ---------------------------------------------------------------------------

const SCAN_TYPE_OPTIONS: Array<{
  value: ScanType;
  label: string;
  description: string;
  icon: typeof Shield;
}> = [
  {
    value: "passive",
    label: "Passive",
    description: "WHOIS, DNS, SSL, content analysis only",
    icon: Shield,
  },
  {
    value: "active",
    label: "Active",
    description: "Browser automation + wallet extraction",
    icon: Zap,
  },
  {
    value: "full",
    label: "Full",
    description: "Passive recon + active browser interaction",
    icon: Search,
  },
];

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type Phase = "idle" | "submitting" | "polling" | "done" | "failed";

export default function SsiInvestigatePage() {
  const [url, setUrl] = useState("");
  const [scanType, setScanType] = useState<ScanType>("passive");
  const [phase, setPhase] = useState<Phase>("idle");
  const [investigationId, setInvestigationId] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string>("pending");
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pollCount = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stepQueued: StepProps["state"] =
    phase === "idle" || phase === "submitting"
      ? "pending"
      : phase === "failed" && apiStatus === "pending"
        ? "error"
        : "done";

  const stepAnalyzing: StepProps["state"] =
    phase === "idle" || phase === "submitting"
      ? "pending"
      : (phase === "polling" && apiStatus === "pending") ||
          apiStatus === "running"
        ? "active"
        : phase === "failed" && apiStatus !== "pending"
          ? "error"
          : phase === "done"
            ? "done"
            : "pending";

  const stepReport: StepProps["state"] =
    phase === "done"
      ? "done"
      : phase === "failed" && apiStatus === "completed"
        ? "error"
        : phase === "polling" &&
            apiStatus !== "running" &&
            apiStatus !== "pending"
          ? "active"
          : "pending";

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const poll = useCallback(
    async (id: string) => {
      if (pollCount.current >= MAX_POLLS) {
        stopPolling();
        setPhase("failed");
        setErrorMsg("Investigation timed out. Please try again.");
        return;
      }
      pollCount.current += 1;

      try {
        const res = await fetch(`/api/ssi/investigate/${id}`);
        if (!res.ok) {
          stopPolling();
          setPhase("failed");
          setErrorMsg("Failed to fetch investigation status.");
          return;
        }
        const data: StatusResponse = await res.json();
        setApiStatus(data.status);

        if (data.status === "completed") {
          stopPolling();
          setResult(data.result ?? null);
          setPhase("done");
        } else if (data.status === "failed") {
          stopPolling();
          setResult(data.result ?? null);
          setPhase("failed");
          setErrorMsg(
            data.result?.error ??
              "Investigation failed. See the report for details.",
          );
        }
      } catch {
        // transient — keep polling
      }
    },
    [stopPolling],
  );

  const startPolling = useCallback(
    (id: string) => {
      pollCount.current = 0;
      intervalRef.current = setInterval(() => {
        void poll(id);
      }, POLL_INTERVAL_MS);
    },
    [poll],
  );

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    setPhase("submitting");
    setErrorMsg(null);
    setResult(null);
    setInvestigationId(null);
    setApiStatus("pending");

    try {
      const res = await fetch("/api/ssi/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmed,
          passive_only: scanType === "passive",
          scan_type: scanType,
        }),
      });
      if (!res.ok) {
        throw new Error("Service unavailable. Please try again later.");
      }
      const data: InvestigateResponse = await res.json();
      setInvestigationId(data.investigation_id);
      setPhase("polling");
      startPolling(data.investigation_id);
    } catch (err) {
      setPhase("failed");
      setErrorMsg(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    }
  }

  function handleReset() {
    stopPolling();
    setPhase("idle");
    setUrl("");
    setInvestigationId(null);
    setApiStatus("pending");
    setResult(null);
    setErrorMsg(null);
  }

  const riskScore = result?.taxonomy_result?.risk_score;
  const hasPdf = Boolean(result?.pdf_report_path);
  const threatCount = result?.threat_indicators?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <SectionLabel>Scam Site Investigator</SectionLabel>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
            Investigate a suspicious URL
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Submit a URL for AI-powered investigation — WHOIS, DNS, SSL, threat
            indicators, fraud classification, wallet extraction, and evidence
            packaging.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/ssi/investigations"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            View past investigations
          </Link>
        </div>
      </header>

      {/* URL form */}
      {phase === "idle" && (
        <div className="max-w-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://suspicious-site.example.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors text-sm whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                Investigate
              </button>
            </div>

            {/* Scan type selector */}
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Scan type
              </legend>
              <div className="grid grid-cols-3 gap-3">
                {SCAN_TYPE_OPTIONS.map(
                  ({ value, label, description, icon: Icon }) => (
                    <label
                      key={value}
                      className={`cursor-pointer rounded-xl border p-3 transition ${
                        scanType === value
                          ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200 dark:border-blue-500 dark:bg-blue-950/50 dark:ring-blue-800"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="scanType"
                        value={value}
                        checked={scanType === value}
                        onChange={() => setScanType(value)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`w-4 h-4 ${
                            scanType === value
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-slate-400"
                          }`}
                        />
                        <span
                          className={`text-sm font-semibold ${
                            scanType === value
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {description}
                      </p>
                    </label>
                  ),
                )}
              </div>
            </fieldset>
          </form>
        </div>
      )}

      {/* Submitting spinner */}
      {phase === "submitting" && (
        <div className="flex flex-col items-center gap-4 py-8 text-slate-500 dark:text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-sm">Queuing investigation…</p>
        </div>
      )}

      {/* Status tracker */}
      {(phase === "polling" || phase === "done" || phase === "failed") && (
        <div className="max-w-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
            <FileSearch className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="font-medium text-slate-900 dark:text-white truncate">
              {url}
            </span>
          </div>

          <div className="space-y-3 pl-1">
            <Step label="Investigation queued" state={stepQueued} />
            <Step
              label="Analysing site (WHOIS · DNS · SSL · content)"
              state={stepAnalyzing}
            />
            <Step label="Generating PDF report" state={stepReport} />
          </div>

          {phase === "polling" && (
            <p className="text-xs text-slate-500 text-center">
              Checking status every 3 seconds… this typically takes 30–90
              seconds.
            </p>
          )}

          {phase === "failed" && errorMsg && (
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300">
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Result card */}
      {phase === "done" && result && (
        <div className="max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="bg-slate-800 dark:bg-slate-900 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold text-sm">
                  Investigation complete
                </p>
                {result.duration_seconds !== undefined && (
                  <p className="text-slate-400 text-xs">
                    Completed in {result.duration_seconds.toFixed(1)}s
                  </p>
                )}
              </div>
            </div>
            {riskScore !== undefined && <RiskBadge score={riskScore} />}
          </div>

          <div className="px-6 py-6 space-y-6">
            {result.classification?.scam_type && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Fraud classification
                </p>
                <p className="text-slate-800 dark:text-slate-200 font-semibold text-base">
                  {result.classification.scam_type}
                </p>
                {result.classification.summary && (
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-relaxed">
                    {result.classification.summary}
                  </p>
                )}
              </div>
            )}

            {result.brand_impersonation && (
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-amber-800 dark:text-amber-300 text-sm">
                  {result.brand_impersonation}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {threatCount > 0 && (
                <MetricCard
                  label="Threat indicators"
                  value={String(threatCount)}
                  danger
                />
              )}
              {result.whois?.registrar && (
                <MetricCard label="Registrar" value={result.whois.registrar} />
              )}
              {result.whois?.registrant_country && (
                <MetricCard
                  label="Registrant country"
                  value={result.whois.registrant_country}
                />
              )}
              {result.whois?.creation_date && (
                <MetricCard
                  label="Domain created"
                  value={result.whois.creation_date}
                />
              )}
            </div>

            {result.warnings && result.warnings.length > 0 && (
              <div className="space-y-2">
                {result.warnings.map((w, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2 text-xs text-yellow-800 dark:text-yellow-300"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-yellow-500" />
                    {w}
                  </div>
                ))}
              </div>
            )}

            {hasPdf && investigationId ? (
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <a
                  href={`/api/ssi/report/${investigationId}`}
                  download={`ssi_report_${investigationId.slice(0, 8)}.pdf`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download PDF report
                </a>
                <a
                  href={`/api/ssi/report/${investigationId}?action=inline`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors text-sm dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in browser
                </a>
              </div>
            ) : (
              <div className="pt-2 flex items-start gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  PDF report not available — the SSI service may not have
                  weasyprint installed.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {(phase === "done" || phase === "failed") && (
        <div>
          <button
            onClick={handleReset}
            className="text-sm text-slate-400 hover:text-slate-900 dark:hover:text-white underline underline-offset-4 transition-colors"
          >
            Investigate another URL
          </button>
        </div>
      )}
    </div>
  );
}

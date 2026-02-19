"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
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
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InvestigateResponse {
  investigation_id: string;
  status: string;
  message: string;
}

interface TaxonomyResult {
  risk_score: number;
  explanation?: string;
  intent?: Array<{ label: string; confidence: number }>;
}

interface Classification {
  scam_type?: string;
  summary?: string;
}

interface ThreatIndicator {
  indicator_type: string;
  value: string;
  context?: string;
  source?: string;
}

interface Whois {
  domain?: string;
  registrar?: string;
  creation_date?: string;
  registrant_country?: string;
}

interface InvestigationResult {
  url?: string;
  status?: string;
  success?: boolean;
  error?: string;
  duration_seconds?: number;
  taxonomy_result?: TaxonomyResult;
  classification?: Classification;
  brand_impersonation?: string;
  threat_indicators?: ThreatIndicator[];
  whois?: Whois;
  pdf_report_path?: string;
  warnings?: string[];
}

interface StatusResponse {
  investigation_id: string;
  status: string;
  result?: InvestigationResult | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 3_000;
const MAX_POLLS = 200; // ~10 min safeguard

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function RiskBadge({ score }: { score: number }) {
  const level = score >= 70 ? "high" : score >= 40 ? "medium" : "low";

  const styles = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-emerald-100 text-emerald-700 border-emerald-200",
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
          <span className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
            <Clock className="w-4 h-4 text-slate-400" />
          </span>
        )}
      </div>
      <span
        className={`text-sm font-medium ${
          state === "active"
            ? "text-blue-700"
            : state === "done"
              ? "text-emerald-700"
              : state === "error"
                ? "text-red-700"
                : "text-slate-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type Phase = "idle" | "submitting" | "polling" | "done" | "failed";

export default function SsiPage() {
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [investigationId, setInvestigationId] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string>("pending");
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pollCount = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step states derived from phase + apiStatus
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
        body: JSON.stringify({ url: trimmed, passive_only: true }),
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
    <div className="min-h-screen flex flex-col">
      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}
      <header className="px-6 py-6 sm:px-12 flex items-center gap-4 border-b border-white/10">
        <Image
          src="/ifg-logomark.svg"
          alt="Intelligence for Good"
          width={36}
          height={36}
          className="opacity-90"
        />
        <div>
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest">
            Intelligence for Good
          </p>
          <p className="text-base font-semibold text-white leading-tight">
            Scam Site Investigator
          </p>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Hero + form */}
      {/* ------------------------------------------------------------------ */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-16 sm:py-24">
        <div className="w-full max-w-2xl space-y-10">
          {/* Title */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-2xl border border-blue-400/30 mb-2">
              <Shield className="w-8 h-8 text-blue-300" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Scam Site <span className="text-blue-300">Investigator</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-lg mx-auto leading-relaxed">
              Enter a suspicious URL and receive a detailed AI-powered
              investigation report — WHOIS, DNS, SSL, threat indicators, and
              fraud classification — packaged as a professional PDF.
            </p>
          </div>

          {/* URL form */}
          {phase === "idle" && (
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
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm backdrop-blur-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-colors text-sm whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  Investigate
                </button>
              </div>
              <p className="text-center text-xs text-slate-500">
                Passive reconnaissance only · No accounts required · Results
                within ~60 seconds
              </p>
            </form>
          )}

          {/* Submitting spinner */}
          {phase === "submitting" && (
            <div className="flex flex-col items-center gap-4 py-8 text-slate-300">
              <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
              <p className="text-sm">Queuing investigation…</p>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Status tracker */}
          {/* ---------------------------------------------------------------- */}
          {(phase === "polling" || phase === "done" || phase === "failed") && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-6">
              {/* Investigated URL */}
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <FileSearch className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="font-medium text-white truncate">{url}</span>
              </div>

              {/* Steps */}
              <div className="space-y-3 pl-1">
                <Step label="Investigation queued" state={stepQueued} />
                <Step
                  label="Analysing site  (WHOIS · DNS · SSL · content)"
                  state={stepAnalyzing}
                />
                <Step label="Generating PDF report" state={stepReport} />
              </div>

              {/* Polling note */}
              {phase === "polling" && (
                <p className="text-xs text-slate-500 text-center">
                  Checking status every 3 seconds… this typically takes 30–90
                  seconds.
                </p>
              )}

              {/* Error */}
              {phase === "failed" && errorMsg && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm text-red-300">
                  <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Result card */}
          {/* ---------------------------------------------------------------- */}
          {phase === "done" && result && (
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
              {/* Card header */}
              <div className="bg-slate-800 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

              {/* Card body */}
              <div className="px-6 py-6 space-y-6">
                {/* Classification */}
                {result.classification?.scam_type && (
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Fraud classification
                    </p>
                    <p className="text-slate-800 font-semibold text-base">
                      {result.classification.scam_type}
                    </p>
                    {result.classification.summary && (
                      <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                        {result.classification.summary}
                      </p>
                    )}
                  </div>
                )}

                {/* Brand impersonation */}
                {result.brand_impersonation && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-800 text-sm">
                      {result.brand_impersonation}
                    </p>
                  </div>
                )}

                {/* Key metrics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {threatCount > 0 && (
                    <MetricCard
                      label="Threat indicators"
                      value={String(threatCount)}
                      danger
                    />
                  )}
                  {result.whois?.registrar && (
                    <MetricCard
                      label="Registrar"
                      value={result.whois.registrar}
                    />
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

                {/* Warnings */}
                {result.warnings && result.warnings.length > 0 && (
                  <div className="space-y-2">
                    {result.warnings.map((w, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-800"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-yellow-500" />
                        {w}
                      </div>
                    ))}
                  </div>
                )}

                {/* Download PDF */}
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
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in browser
                    </a>
                  </div>
                ) : (
                  <div className="pt-2 flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-500 text-sm">
                      PDF report not available — the SSI service may not have
                      weasyprint installed. Check the server logs for details.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Investigate another URL */}
          {(phase === "done" || phase === "failed") && (
            <div className="text-center">
              <button
                onClick={handleReset}
                className="text-sm text-slate-400 hover:text-white underline underline-offset-4 transition-colors"
              >
                Investigate another URL
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Footer */}
      {/* ------------------------------------------------------------------ */}
      <footer className="px-6 py-6 text-center text-xs text-slate-600 border-t border-white/5">
        Intelligence for Good · Scam Site Investigator ·{" "}
        <a
          href="https://intelligenceforgood.org"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-400 transition-colors underline underline-offset-2"
        >
          intelligenceforgood.org
        </a>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MetricCard
// ---------------------------------------------------------------------------

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
        danger ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"
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
          danger ? "text-red-700" : "text-slate-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

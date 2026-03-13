"use client";

import { useState } from "react";
import { Card, FeedbackButton } from "@i4g/ui-kit";
import { FileText, Loader2 } from "lucide-react";

const TEMPLATES = [
  {
    id: "executive_summary",
    name: "Executive Impact Summary",
    description: "KPI overview, loss distribution, and detection velocity.",
    defaultTlp: "TLP:AMBER",
  },
  {
    id: "lea_dossier",
    name: "LEA Evidence Dossier",
    description:
      "Full evidence package for law enforcement referral with chain-of-custody.",
    defaultTlp: "TLP:RED",
  },
];

const TLP_OPTIONS = ["TLP:WHITE", "TLP:GREEN", "TLP:AMBER", "TLP:RED"];

export default function ReportBuilderPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [scope, setScope] = useState<string>("last_30_days");
  const [tlp, setTlp] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    reportId: string;
    status: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const template = TEMPLATES.find((t) => t.id === selectedTemplate);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplate) return;

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: selectedTemplate,
          scope,
          tlp: tlp || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? `Request failed: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="group relative mx-auto max-w-2xl space-y-6">
      <FeedbackButton
        feedbackId="reports.builder"
        className="absolute top-1 right-0 z-10"
      />
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Reports
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Report Builder
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate an executive summary or LEA evidence dossier.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-slate-700">
            Select Template
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <label
                key={t.id}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                  selectedTemplate === t.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value={t.id}
                  checked={selectedTemplate === t.id}
                  onChange={(e) => {
                    setSelectedTemplate(e.target.value);
                    setTlp("");
                  }}
                  className="sr-only"
                />
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-900">
                    {t.name}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{t.description}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Default: {t.defaultTlp}
                </p>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-2">
          <label
            htmlFor="scope"
            className="block text-sm font-medium text-slate-700"
          >
            Scope
          </label>
          <input
            id="scope"
            type="text"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. last_30_days, campaign:ABC-123, all"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="tlp"
            className="block text-sm font-medium text-slate-700"
          >
            TLP Override (optional)
          </label>
          <select
            id="tlp"
            value={tlp}
            onChange={(e) => setTlp(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">
              Use default
              {template ? ` (${template.defaultTlp})` : ""}
            </option>
            {TLP_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!selectedTemplate || submitting}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Generate Report
            </>
          )}
        </button>
      </form>

      {result && (
        <Card className="border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">
            Report queued successfully.
          </p>
          <p className="mt-1 text-xs text-green-600">
            Report ID: {result.reportId} — Status: {result.status}
          </p>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            Report generation failed.
          </p>
          <p className="mt-1 text-xs text-red-600">{error}</p>
        </Card>
      )}
    </div>
  );
}

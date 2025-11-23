"use client";

import { useCallback, useState } from "react";
import { Badge, Button, Card, Input } from "@i4g/ui-kit";
import { AlertCircle, CheckCircle2, Loader2, UploadCloud } from "lucide-react";

const sourceOptions = [
  { value: "analyst-console", label: "Analyst console" },
  { value: "partner-intake", label: "Partner intake" },
  { value: "self-report", label: "Self report" },
  { value: "law-enforcement", label: "Law enforcement" },
  { value: "unknown", label: "Unknown" },
] as const;

const preferredContactOptions = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "chat", label: "Messaging handle" },
] as const;

const initialForm = {
  reporterName: "",
  summary: "",
  details: "",
  contactEmail: "",
  contactPhone: "",
  contactHandle: "",
  preferredContact: "email",
  incidentDate: "",
  lossAmount: "",
  source: "analyst-console",
};

type IntakeReceipt = {
  intake_id: string;
  job_id?: string | null;
  status?: string;
};

export default function CaseIntakeForm() {
  const [form, setForm] = useState(initialForm);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<IntakeReceipt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }, []);

  const handleFilesChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = event.target.files ? Array.from(event.target.files).slice(0, 5) : [];
    setAttachments(nextFiles);
  }, []);

  const resetForm = useCallback(() => {
    setForm(initialForm);
    setAttachments([]);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setReceipt(null);

      const payload = {
        reporter_name: form.reporterName,
        summary: form.summary,
        details: form.details,
        contact_email: form.contactEmail || undefined,
        contact_phone: form.contactPhone || undefined,
        contact_handle: form.contactHandle || undefined,
        preferred_contact: form.preferredContact || undefined,
        incident_date: form.incidentDate || undefined,
        loss_amount: form.lossAmount ? Number(form.lossAmount) : undefined,
        source: form.source,
        metadata: {
          submitted_via: "analyst-console",
        },
      };

      const body = new FormData();
      body.append("payload", JSON.stringify(payload));
      attachments.forEach((file) => {
        body.append("files", file, file.name);
      });

      setIsSubmitting(true);

      try {
        const response = await fetch("/api/intakes", {
          method: "POST",
          body,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: "Intake submission failed" }));
          const message = typeof data.error === "string" ? data.error : "Intake submission failed";
          setError(message);
          return;
        }

        const result = (await response.json()) as IntakeReceipt;
        setReceipt(result);
        resetForm();
      } catch {
        setError("Unable to submit intake. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [attachments, form, resetForm]
  );

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="reporterName" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Reporter name
            </label>
            <Input
              id="reporterName"
              name="reporterName"
              required
              value={form.reporterName}
              onChange={handleChange}
              placeholder="Who shared this incident?"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="source" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Source
            </label>
            <select
              id="source"
              name="source"
              value={form.source}
              onChange={handleChange}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              {sourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="summary" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Summary
          </label>
          <Input
            id="summary"
            name="summary"
            required
            value={form.summary}
            onChange={handleChange}
            placeholder="Short description for analysts"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="details" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Details
          </label>
          <textarea
            id="details"
            name="details"
            required
            value={form.details}
            onChange={handleChange}
            rows={6}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Describe what happened, include links, wallet ids, or other signals."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="contactEmail" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Contact email
            </label>
            <Input id="contactEmail" name="contactEmail" value={form.contactEmail} onChange={handleChange} type="email" />
          </div>
          <div className="space-y-1">
            <label htmlFor="contactPhone" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Contact phone
            </label>
            <Input id="contactPhone" name="contactPhone" value={form.contactPhone} onChange={handleChange} />
          </div>
          <div className="space-y-1">
            <label htmlFor="contactHandle" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Handle / chat id
            </label>
            <Input id="contactHandle" name="contactHandle" value={form.contactHandle} onChange={handleChange} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="preferredContact" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Preferred contact
            </label>
            <select
              id="preferredContact"
              name="preferredContact"
              value={form.preferredContact}
              onChange={handleChange}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              {preferredContactOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="incidentDate" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Incident date
            </label>
            <Input id="incidentDate" name="incidentDate" value={form.incidentDate} onChange={handleChange} type="date" />
          </div>
          <div className="space-y-1">
            <label htmlFor="lossAmount" className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Estimated loss (USD)
            </label>
            <Input id="lossAmount" name="lossAmount" value={form.lossAmount} onChange={handleChange} type="number" min="0" step="0.01" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Evidence attachments
          </label>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
            <UploadCloud className="mx-auto mb-2 h-5 w-5 text-teal-500" />
            <p>Upload screenshots, PDFs, or logs (5 files max).</p>
            <input
              type="file"
              multiple
              onChange={handleFilesChange}
              className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-700"
            />
          </div>
          {attachments.length ? (
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {attachments.map((file) => (
                <Badge key={file.name} variant="info">
                  {file.name}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        {error ? (
          <Card className="border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </Card>
        ) : null}

        {receipt ? (
          <Card className="border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Intake {receipt.intake_id} queued. {receipt.job_id ? `Processing job ${receipt.job_id}.` : ""}
            </div>
          </Card>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting || !form.reporterName || !form.summary || !form.details}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Submitting" : "Submit"}
          </Button>
          <Button type="button" variant="secondary" onClick={resetForm} disabled={isSubmitting}>
            Clear form
          </Button>
        </div>
      </form>
    </Card>
  );
}

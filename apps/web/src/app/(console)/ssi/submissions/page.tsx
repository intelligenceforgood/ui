"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Card, SectionLabel, FeedbackButton } from "@i4g/ui-kit";
import {
  ArrowLeft,
  CheckCircle,
  Globe,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";
import type {
  EcxApproveRequest,
  EcxSubmission,
  EcxSubmissionsResponse,
  EcxSubmissionStatus,
} from "@/types/ssi";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CLASS: Record<string, string> = {
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

const MODULE_LABEL: Record<string, string> = {
  phish: "Phish URL",
  "malicious-domain": "Domain",
  "malicious-ip": "IP",
  "cryptocurrency-addresses": "Wallet",
};

const STATUS_OPTIONS: Array<{
  key: EcxSubmissionStatus | "all";
  label: string;
}> = [
  { key: "all", label: "All" },
  { key: "queued", label: "Queued" },
  { key: "submitted", label: "Submitted" },
  { key: "failed", label: "Failed" },
  { key: "rejected", label: "Rejected" },
  { key: "retracted", label: "Retracted" },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusPills({
  active,
  onChange,
}: {
  active: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_OPTIONS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            active === key
              ? "bg-indigo-700 text-white dark:bg-indigo-300 dark:text-indigo-950"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SubmissionsQueuePage() {
  const [statusFilter, setStatusFilter] = useState<string>("queued");
  const [submissions, setSubmissions] = useState<EcxSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** IDs of checked rows */
  const [selected, setSelected] = useState<Set<string>>(new Set());
  /** Text entered into the bulk analyst input */
  const [bulkAnalyst, setBulkAnalyst] = useState("");
  /** Per-row actions in flight */
  const [actingOn, setActingOn] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const qs =
        statusFilter !== "all"
          ? `?status=${statusFilter}&limit=200`
          : "?limit=200";
      const res = await fetch(`/api/ssi/ecx/submissions${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as EcxSubmissionsResponse;
      setSubmissions(json.submissions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function toggleAll() {
    if (selected.size === submissions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(submissions.map((s) => s.submission_id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function act(
    id: string,
    endpoint: "approve" | "reject" | "retract",
    body: object,
  ) {
    setActingOn((prev) => new Set([...prev, id]));
    try {
      const res = await fetch(`/api/ssi/ecx/submissions/${id}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const msg = (await res.json()) as { detail?: string };
        throw new Error(msg.detail ?? `HTTP ${res.status}`);
      }
    } finally {
      setActingOn((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleBulkApprove() {
    if (!bulkAnalyst.trim()) {
      alert("Enter your analyst identifier for the bulk action.");
      return;
    }
    const ids = [...selected];
    const body: EcxApproveRequest = { analyst: bulkAnalyst.trim() };
    await Promise.allSettled(ids.map((id) => act(id, "approve", body)));
    await reload();
  }

  async function handleBulkReject() {
    if (!bulkAnalyst.trim()) {
      alert("Enter your analyst identifier for the bulk action.");
      return;
    }
    if (!confirm(`Reject ${selected.size} submission(s)?`)) return;
    const ids = [...selected];
    await Promise.allSettled(
      ids.map((id) => act(id, "reject", { analyst: bulkAnalyst.trim() })),
    );
    await reload();
  }

  async function handleSingleApprove(sub: EcxSubmission) {
    if (!bulkAnalyst.trim()) {
      alert("Enter your analyst identifier in the bulk action bar above.");
      return;
    }
    await act(sub.submission_id, "approve", {
      analyst: bulkAnalyst.trim(),
      release_label: sub.release_label ?? "",
    });
    await reload();
  }

  async function handleSingleReject(sub: EcxSubmission) {
    if (!bulkAnalyst.trim()) {
      alert("Enter your analyst identifier in the bulk action bar above.");
      return;
    }
    await act(sub.submission_id, "reject", { analyst: bulkAnalyst.trim() });
    await reload();
  }

  async function handleSingleRetract(sub: EcxSubmission) {
    if (!bulkAnalyst.trim()) {
      alert("Enter your analyst identifier in the bulk action bar above.");
      return;
    }
    if (
      !confirm(
        `Retract submission for "${sub.submitted_value}" from eCrimeX? This cannot be undone.`,
      )
    )
      return;
    await act(sub.submission_id, "retract", { analyst: bulkAnalyst.trim() });
    await reload();
  }

  const queuedSelected = submissions.filter(
    (s) =>
      selected.has(s.submission_id) &&
      (s.status === "queued" || s.status === "pending"),
  ).length;

  return (
    <div className="group relative space-y-8">
      <FeedbackButton
        feedbackId="ssi-submissions.queue"
        className="absolute top-1 right-0 z-10"
      />

      <header>
        <Link
          href="/ssi/investigations"
          className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Investigations
        </Link>
        <SectionLabel>eCrimeX Integration</SectionLabel>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white flex items-center gap-3">
          <Upload className="w-7 h-7 text-indigo-500" />
          Submission Queue
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-3xl">
          Review, approve, reject, or retract indicators submitted to the APWG
          eCrimeX data clearinghouse. Queued items are waiting for analyst
          approval before transmission. Use the bulk action bar to process
          multiple items at once.
        </p>
      </header>

      {/* Status filter */}
      <StatusPills active={statusFilter} onChange={setStatusFilter} />

      {/* Bulk action bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Bulk actions
          </span>
          <input
            value={bulkAnalyst}
            onChange={(e) => setBulkAnalyst(e.target.value)}
            placeholder="Your analyst identifier"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => void handleBulkApprove()}
            disabled={queuedSelected === 0 || !bulkAnalyst.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
            Approve selected ({queuedSelected})
          </button>
          <button
            onClick={() => void handleBulkReject()}
            disabled={queuedSelected === 0 || !bulkAnalyst.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <XCircle className="w-4 h-4" />
            Reject selected ({queuedSelected})
          </button>
          <button
            onClick={() => void reload()}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </Card>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Submissions table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <Card className="p-12 text-center">
          <Upload className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No submissions found for the selected filter.
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Submissions are created automatically after investigations complete
            when ECX integration is enabled.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800">
                <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 pl-4 pr-3">
                    <input
                      type="checkbox"
                      checked={
                        selected.size === submissions.length &&
                        submissions.length > 0
                      }
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="py-3 pr-3">Module</th>
                  <th className="py-3 pr-3">Value</th>
                  <th className="py-3 pr-3">Confidence</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3">eCX ID</th>
                  <th className="py-3 pr-3">Investigation</th>
                  <th className="py-3 pr-3">Submitted at</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {submissions.map((sub) => {
                  const isQueued =
                    sub.status === "queued" || sub.status === "pending";
                  const isSubmitted = sub.status === "submitted";
                  const isBusy = actingOn.has(sub.submission_id);
                  return (
                    <tr
                      key={sub.submission_id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        selected.has(sub.submission_id)
                          ? "bg-indigo-50 dark:bg-indigo-950/20"
                          : ""
                      }`}
                    >
                      <td className="py-3 pl-4 pr-3">
                        <input
                          type="checkbox"
                          checked={selected.has(sub.submission_id)}
                          onChange={() => toggleOne(sub.submission_id)}
                          disabled={!isQueued}
                          className="rounded disabled:opacity-40"
                        />
                      </td>
                      <td className="py-3 pr-3 font-medium text-slate-700 dark:text-slate-300">
                        {MODULE_LABEL[sub.ecx_module] ?? sub.ecx_module}
                      </td>
                      <td className="py-3 pr-3 font-mono text-xs text-slate-600 dark:text-slate-400 max-w-[18rem] break-all">
                        {sub.submitted_value}
                      </td>
                      <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">
                        {sub.confidence}%
                      </td>
                      <td className="py-3 pr-3">
                        <Badge
                          className={
                            STATUS_CLASS[sub.status] ?? STATUS_CLASS.pending
                          }
                        >
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3 text-slate-500 dark:text-slate-400">
                        {sub.ecx_record_id ?? "—"}
                      </td>
                      <td className="py-3 pr-3">
                        {sub.scan_id ? (
                          <Link
                            href={`/ssi/investigations/${sub.scan_id}`}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                          >
                            <Globe className="w-3 h-3" />
                            <span className="font-mono">
                              {sub.scan_id.slice(0, 8)}
                            </span>
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {sub.submitted_at
                          ? new Date(sub.submitted_at).toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-1">
                          {isQueued && (
                            <>
                              <button
                                onClick={() => void handleSingleApprove(sub)}
                                disabled={isBusy}
                                title="Approve"
                                className="rounded bg-emerald-100 p-1 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-900 dark:text-emerald-300"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => void handleSingleReject(sub)}
                                disabled={isBusy}
                                title="Reject"
                                className="rounded bg-red-100 p-1 text-red-700 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900 dark:text-red-300"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isSubmitted && (
                            <button
                              onClick={() => void handleSingleRetract(sub)}
                              disabled={isBusy}
                              title="Retract"
                              className="rounded bg-slate-100 p-1 text-slate-600 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-400"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
            {submissions.length} submission{submissions.length !== 1 ? "s" : ""}{" "}
            · {selected.size} selected
          </div>
        </Card>
      )}
    </div>
  );
}

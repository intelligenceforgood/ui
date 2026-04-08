"use client";

import { useTransition, useState, useCallback } from "react";
import Link from "next/link";
import {
  createEngagement,
  updateEngagement,
  assignCases,
} from "@/lib/server/engagements-service";
import { Badge } from "@i4g/ui-kit";
import type { Engagement } from "@i4g/sdk";
import { Plus, Play, CheckCircle2, Archive, Trophy } from "lucide-react";

const statusVariant: Record<
  string,
  "success" | "default" | "warning" | "info" | "danger"
> = {
  active: "success",
  draft: "default",
  completed: "info",
  archived: "warning",
};

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface EngagementsTableProps {
  engagements: Engagement[];
}

export function EngagementsTable({
  engagements: initial,
}: EngagementsTableProps) {
  const [engagements, setEngagements] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [bulkTarget, setBulkTarget] = useState<string | null>(null);
  const [bulkCaseIds, setBulkCaseIds] = useState("");
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showFeedbackMsg = useCallback(
    (message: string, type: "success" | "error") => {
      setFeedback({ message, type });
      setTimeout(() => setFeedback(null), 3000);
    },
    [],
  );

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      try {
        const eng = await createEngagement({
          name: formData.get("name") as string,
          description: (formData.get("description") as string) || null,
          starts_at: (formData.get("starts_at") as string) || null,
          ends_at: (formData.get("ends_at") as string) || null,
        });
        setEngagements((prev) => [eng, ...prev]);
        setShowCreate(false);
        showFeedbackMsg(`Created "${eng.name}"`, "success");
      } catch {
        showFeedbackMsg("Failed to create engagement", "error");
      }
    });
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    startTransition(async () => {
      try {
        const updated = await updateEngagement(id, { status: newStatus });
        setEngagements((prev) =>
          prev.map((e) => (e.engagementId === id ? updated : e)),
        );
        showFeedbackMsg(`Status updated to ${newStatus}`, "success");
      } catch {
        showFeedbackMsg("Failed to update status", "error");
      }
    });
  };

  const handleBulkAssign = () => {
    if (!bulkTarget || !bulkCaseIds.trim()) return;
    const ids = bulkCaseIds
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    startTransition(async () => {
      try {
        const result = await assignCases(bulkTarget, ids);
        showFeedbackMsg(`Assigned ${result.count} case(s)`, "success");
        setBulkTarget(null);
        setBulkCaseIds("");
      } catch {
        showFeedbackMsg("Failed to assign cases", "error");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`rounded-lg px-4 py-2 text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Create button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Plus className="h-4 w-4" />
          New Engagement
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form
          action={handleCreate}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
            Create Engagement
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="eng-name"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Name *
              </label>
              <input
                id="eng-name"
                name="name"
                required
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="eng-desc"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Description
              </label>
              <input
                id="eng-desc"
                name="description"
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="eng-start"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Starts At
              </label>
              <input
                id="eng-start"
                name="starts_at"
                type="date"
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="eng-end"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Ends At
              </label>
              <input
                id="eng-end"
                name="ends_at"
                type="date"
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-500 disabled:opacity-50"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Engagements table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {isPending && (
          <div className="border-b border-sky-200 bg-sky-50 px-4 py-2 text-xs text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300">
            Saving changes…
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">
                Starts
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">
                Ends
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {engagements.map((eng) => (
              <tr
                key={eng.engagementId}
                className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                  {eng.name}
                  {eng.description && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      {eng.description}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[eng.status] ?? "default"}>
                    {eng.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {formatDate(eng.startsAt)}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {formatDate(eng.endsAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {eng.status === "draft" && (
                      <button
                        type="button"
                        title="Activate"
                        disabled={isPending}
                        onClick={() =>
                          handleStatusChange(eng.engagementId, "active")
                        }
                        className="rounded-md p-1.5 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50 dark:hover:bg-emerald-950"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    {eng.status === "active" && (
                      <button
                        type="button"
                        title="Complete"
                        disabled={isPending}
                        onClick={() =>
                          handleStatusChange(eng.engagementId, "completed")
                        }
                        className="rounded-md p-1.5 text-sky-600 transition hover:bg-sky-50 disabled:opacity-50 dark:hover:bg-sky-950"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                    {(eng.status === "completed" || eng.status === "draft") && (
                      <button
                        type="button"
                        title="Archive"
                        disabled={isPending}
                        onClick={() =>
                          handleStatusChange(eng.engagementId, "archived")
                        }
                        className="rounded-md p-1.5 text-amber-600 transition hover:bg-amber-50 disabled:opacity-50 dark:hover:bg-amber-950"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Assign cases"
                      disabled={isPending}
                      onClick={() =>
                        setBulkTarget(
                          bulkTarget === eng.engagementId
                            ? null
                            : eng.engagementId,
                        )
                      }
                      className="rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
                    >
                      + Cases
                    </button>
                    {(eng.status === "active" ||
                      eng.status === "completed") && (
                      <Link
                        href={`/admin/engagements/${eng.engagementId}/leaderboard`}
                        title="Leaderboard"
                        className="rounded-md p-1.5 text-purple-600 transition hover:bg-purple-50 dark:hover:bg-purple-950"
                      >
                        <Trophy className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {engagements.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-400"
                >
                  No engagements yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk case assignment panel */}
      {bulkTarget && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
            Assign Cases to{" "}
            {engagements.find((e) => e.engagementId === bulkTarget)?.name}
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            Enter case IDs separated by commas, spaces, or newlines.
          </p>
          <textarea
            value={bulkCaseIds}
            onChange={(e) => setBulkCaseIds(e.target.value)}
            rows={3}
            placeholder="case-001, case-002, case-003"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={isPending || !bulkCaseIds.trim()}
              onClick={handleBulkAssign}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-500 disabled:opacity-50"
            >
              Assign
            </button>
            <button
              type="button"
              onClick={() => {
                setBulkTarget(null);
                setBulkCaseIds("");
              }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

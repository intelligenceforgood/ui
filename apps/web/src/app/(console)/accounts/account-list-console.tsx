"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Download, Loader2, RefreshCcw } from "lucide-react";
import { Badge, Button, Card } from "@i4g/ui-kit";
import type { AccountListRun } from "@/lib/server/account-list-service";

type Props = {
  initialRuns: AccountListRun[];
};

type StatusState = {
  variant: "idle" | "success" | "error";
  message?: string;
};

const DEFAULT_CATEGORIES = ["bank", "crypto", "payments"];
const DEFAULT_FORMATS = ["xlsx", "pdf"];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function categoryLabel(key: string) {
  switch (key) {
    case "bank":
      return "Bank";
    case "crypto":
      return "Crypto";
    case "payments":
      return "Payments";
    default:
      return key;
  }
}

function ArtifactList({ artifacts }: { artifacts: Record<string, string> }) {
  const entries = Object.entries(artifacts ?? {});
  if (!entries.length) {
    return <p className="text-sm text-slate-400">No artifacts yet</p>;
  }
  return (
    <ul className="space-y-1 text-sm">
      {entries.map(([format, href]) => (
        <li key={format}>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700"
          >
            <Download className="h-3.5 w-3.5" />
            {format.toUpperCase()}
          </a>
        </li>
      ))}
    </ul>
  );
}

function WarningList({ warnings }: { warnings: string[] }) {
  if (!warnings.length) {
    return <p className="text-sm text-slate-400">No warnings reported</p>;
  }
  return (
    <ul className="space-y-2 text-sm text-amber-600">
      {warnings.map((warning) => (
        <li key={warning} className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          {warning}
        </li>
      ))}
    </ul>
  );
}

export function AccountListConsole({ initialRuns }: Props) {
  const [runs, setRuns] = useState<AccountListRun[]>(initialRuns);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<StatusState>({ variant: "idle" });

  const latestRun = runs.at(0);

  const refreshRuns = useCallback(async () => {
    const response = await fetch("/api/account-list/runs?limit=8", { cache: "no-store" });
    const body = (await response.json().catch(() => ({}))) as { runs?: AccountListRun[]; error?: string };
    if (!response.ok) {
      throw new Error(body.error ?? "Failed to refresh runs");
    }
    setRuns(body.runs ?? []);
  }, []);

  const onSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setPending(true);
    setStatus({ variant: "idle" });

    const form = new FormData(formElement);
    const startDate = (form.get("startDate") as string) || undefined;
    const endDate = (form.get("endDate") as string) || undefined;
    const categories = form.getAll("categories").map((value) => String(value));
    const outputFormats = form.getAll("outputs").map((value) => String(value));
    const topKRaw = Number(form.get("topK"));
    const topK = Number.isFinite(topKRaw) ? topKRaw : 100;
    const includeSources = form.get("includeSources") === "on";

    try {
      const response = await fetch("/api/account-list/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          categories: categories.length ? categories : undefined,
          topK,
          includeSources,
          outputFormats: outputFormats.length ? outputFormats : DEFAULT_FORMATS,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        result?: { request_id: string; indicators: unknown[]; warnings: string[] };
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload?.error ?? "Run failed");
      }
      if (!payload?.result) {
        throw new Error("Missing run payload");
      }

      setStatus({
        variant: "success",
        message: `Run ${payload.result.request_id} completed with ${payload.result.indicators.length} indicators`,
      });

      await refreshRuns();
      formElement.reset();
    } catch (error) {
      console.error("Account list run failed", error);
      setStatus({
        variant: "error",
        message: error instanceof Error ? error.message : "Unable to start run",
      });
    } finally {
      setPending(false);
    }
  }, [refreshRuns]);

  const statusBadge = useMemo(() => {
    if (status.variant === "success") {
      return (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {status.message}
        </div>
      );
    }
    if (status.variant === "error") {
      return (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" />
          {status.message}
        </div>
      );
    }
    return null;
  }, [status]);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="p-6">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Launch manual run</h2>
              <p className="text-sm text-slate-500">
                Choose date range, indicator categories, and artifact formats before running the extractor.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-600">
                <span className="font-medium text-slate-900">Start date</span>
                <input
                  type="date"
                  name="startDate"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-600">
                <span className="font-medium text-slate-900">End date</span>
                <input
                  type="date"
                  name="endDate"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">Indicator categories</p>
              <div className="flex flex-wrap gap-3">
                {DEFAULT_CATEGORIES.map((category) => (
                  <label key={category} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      name="categories"
                      value={category}
                      defaultChecked
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    {categoryLabel(category)}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm text-slate-600">
                <span className="font-medium text-slate-900">Top K per category</span>
                <input
                  type="number"
                  name="topK"
                  min={5}
                  max={250}
                  defaultValue={100}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-600">
                <span className="font-medium text-slate-900">Include sources</span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                  <input
                    type="checkbox"
                    name="includeSources"
                    defaultChecked
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-slate-600">Return supporting documents</span>
                </div>
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">Artifact formats</p>
              <div className="flex flex-wrap gap-3">
                {DEFAULT_FORMATS.map((format) => (
                  <label key={format} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      name="outputs"
                      value={format}
                      defaultChecked
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    {format.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={pending} className="inline-flex items-center gap-2">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Start extraction
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="inline-flex items-center gap-2"
                onClick={() => {
                  refreshRuns().catch((error) =>
                    setStatus({
                      variant: "error",
                      message: error instanceof Error ? error.message : "Unable to refresh runs",
                    }),
                  );
                }}
                disabled={pending}
              >
                <RefreshCcw className="h-4 w-4" /> Refresh history
              </Button>
              {statusBadge}
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Latest run</p>
                <p className="text-xs text-slate-500">Auto-refresh after each manual run</p>
              </div>
            </div>
            {latestRun ? (
              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex flex-wrap gap-2">
                  {(latestRun?.categories ?? []).map((category) => (
                    <Badge key={category} variant="info">
                      {categoryLabel(category)}
                    </Badge>
                  ))}
                </div>
                <p>
                  <span className="font-semibold text-slate-900">Run ID:</span> {latestRun.request_id}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Generated:</span> {formatDate(latestRun.generated_at)}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Indicators:</span> {latestRun.indicator_count} · Sources: {latestRun.source_count}
                </p>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Artifacts</p>
                  <ArtifactList artifacts={latestRun.artifacts} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Warnings</p>
                  <WarningList warnings={latestRun.warnings} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No runs captured yet.</p>
            )}
          </Card>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Run history</h2>
            <p className="text-sm text-slate-500">Recent account list executions across the analyst console and API.</p>
          </div>
          <Badge variant="default">{runs.length} tracked</Badge>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Run ID</th>
                <th className="px-3 py-2">Generated</th>
                <th className="px-3 py-2">Categories</th>
                <th className="px-3 py-2">Indicators</th>
                <th className="px-3 py-2">Artifacts</th>
                <th className="px-3 py-2">Warnings</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.request_id} className="border-t border-slate-100 text-slate-700">
                  <td className="px-3 py-3 font-mono text-xs text-slate-500">{run.request_id}</td>
                  <td className="px-3 py-3">{formatDate(run.generated_at)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {run.categories.map((category) => (
                        <Badge key={`${run.request_id}-${category}`} variant="info">
                          {categoryLabel(category)}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-semibold text-slate-900">{run.indicator_count}</span>
                    <span className="text-xs text-slate-400"> · {run.source_count} sources</span>
                  </td>
                  <td className="px-3 py-3">
                    <ArtifactList artifacts={run.artifacts} />
                  </td>
                  <td className="px-3 py-3">
                    <WarningList warnings={run.warnings} />
                  </td>
                </tr>
              ))}
              {!runs.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-500">
                    No runs captured yet. Start one above to populate history.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

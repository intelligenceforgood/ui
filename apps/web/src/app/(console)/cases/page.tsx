import type { Metadata } from "next";
import { Badge, Button, Card } from "@i4g/ui-kit";
import { getI4GClient } from "@/lib/i4g-client";
import type { CaseSummary } from "@i4g/sdk";
import {
  ArrowUpRight,
  Briefcase,
  Gauge,
  ShieldAlert,
  Tags,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Cases & Tasks",
  description: "Triage, assign, and progress investigations across teams.",
};

const statusStyles: Record<CaseSummary["status"], string> = {
  new: "bg-slate-100 text-slate-600",
  active: "bg-teal-50 text-teal-600",
  blocked: "bg-rose-50 text-rose-600",
  "awaiting-input": "bg-amber-50 text-amber-600",
  closed: "bg-slate-200 text-slate-600",
};

const priorityStyles: Record<CaseSummary["priority"], string> = {
  critical: "bg-rose-100 text-rose-600",
  high: "bg-amber-100 text-amber-600",
  medium: "bg-sky-100 text-sky-600",
  low: "bg-slate-100 text-slate-600",
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function CasesPage() {
  const client = getI4GClient();
  const { summary, cases, queues } = await client.listCases();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Case pipeline
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Coordinate investigations and follow-ups
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Monitor workload across queues, resolve blockers, and keep priority cases moving with clear ownership.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" className="shadow-lg">
            New case intake
          </Button>
          <Button type="button" variant="secondary">
            Export status report
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center gap-3">
            <Briefcase className="h-9 w-9 rounded-2xl bg-teal-50 p-2 text-teal-600" />
            <div>
              <p className="text-sm text-slate-500">Active cases</p>
              <p className="text-2xl font-semibold text-slate-900">{summary.active}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-9 w-9 rounded-2xl bg-rose-50 p-2 text-rose-500" />
            <div>
              <p className="text-sm text-slate-500">Escalations</p>
              <p className="text-2xl font-semibold text-slate-900">{summary.escalations}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Gauge className="h-9 w-9 rounded-2xl bg-amber-50 p-2 text-amber-500" />
            <div>
              <p className="text-sm text-slate-500">Due today</p>
              <p className="text-2xl font-semibold text-slate-900">{summary.dueToday}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Users className="h-9 w-9 rounded-2xl bg-sky-50 p-2 text-sky-500" />
            <div>
              <p className="text-sm text-slate-500">Pending review</p>
              <p className="text-2xl font-semibold text-slate-900">{summary.pendingReview}</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Cases</h2>
            <Badge variant="info">{cases.length} in view</Badge>
          </div>
          <div className="divide-y divide-slate-100">
            {cases.map((caseItem) => (
              <div key={caseItem.id} className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className={`rounded-full px-3 py-1 ${priorityStyles[caseItem.priority]}`}>
                      Priority: {caseItem.priority}
                    </span>
                    <span className={`rounded-full px-3 py-1 ${statusStyles[caseItem.status]}`}>
                      {caseItem.status.replace("-", " ")}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">
                      Queue: {caseItem.queue}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">{caseItem.title}</h3>
                  <p className="text-xs text-slate-500">
                    Owner {caseItem.assignee} · Updated {formatDate(caseItem.updatedAt)}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {caseItem.tags.map((tag) => (
                      <Badge key={`${caseItem.id}-${tag}`} variant="default">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex w-full flex-col gap-3 sm:max-w-[220px]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Progress
                    </p>
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-teal-400"
                        style={{ width: `${caseItem.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    Due {formatDate(caseItem.dueAt)}
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-end gap-2 text-xs font-semibold text-teal-600 transition hover:text-teal-700"
                  >
                    Open workspace
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Queues</h2>
            <Badge variant="default">{queues.length} total</Badge>
          </div>
          <div className="space-y-4">
            {queues.map((queue) => (
              <div key={queue.id} className="rounded-xl border border-slate-100 bg-white/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{queue.name}</p>
                  <Badge variant="info">{queue.count} cases</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-500">{queue.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <Tags className="h-3.5 w-3.5" />
                  Primary tags
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

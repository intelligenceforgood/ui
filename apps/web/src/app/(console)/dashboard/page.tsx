import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  AlertOctagon,
  ArrowUpRight,
  Bell,
  FileCheck2,
  FileSearch,
  Map,
  ShieldCheck,
  SignalHigh,
} from "lucide-react";
import { Badge, Card, FeedbackButton } from "@i4g/ui-kit";
import { getI4GClient } from "@/lib/i4g-client";
import type { DashboardReminder } from "@i4g/sdk";
import { TextWithTokens } from "@/components/text-with-tokens";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Operational overview for Intelligence for Good analysts.",
};

const quickActions = [
  {
    href: "/search",
    label: "Run an intelligence search",
    description: "Search across filings, chatter, and partner feeds.",
    icon: FileSearch,
  },
  {
    href: "/reports/dossiers",
    label: "Verify evidence dossiers",
    description: "Inspect manifest signatures before distribution.",
    icon: FileCheck2,
  },
  {
    href: "/cases",
    label: "Review assigned cases",
    description: "Prioritise workstreams and collaborate with teams.",
    icon: ShieldCheck,
  },
  {
    href: "/taxonomy",
    label: "Update taxonomy tags",
    description: "Keep shared vocabularies aligned with policy.",
    icon: Map,
  },
];

const reminderIconMap: Record<DashboardReminder["category"], ReactNode> = {
  coordination: <Bell className="h-4 w-4 text-amber-500" />,
  legal: <ShieldCheck className="h-4 w-4 text-teal-500" />,
  data: <Map className="h-4 w-4 text-sky-500" />,
  alert: <AlertOctagon className="h-4 w-4 text-rose-500" />,
};

export default async function DashboardPage() {
  const client = getI4GClient();
  const [{ metrics, alerts, activity, reminders }, progress] =
    await Promise.all([
      client.getDashboardOverview(),
      client.getProcessingProgress().catch(() => ({
        totalCases: 0,
        classifiedCases: 0,
        casesWithEntities: 0,
      })),
    ]);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Today&apos;s overview
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Intelligence for Good Analyst Console
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Track investigations, monitor alerts, and jump back into workstreams
            across the analyst console.
          </p>
        </div>
      </section>

      <section className="group relative grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FeedbackButton
          feedbackId="dashboard.metrics"
          className="absolute -top-1 right-0 z-10"
        />
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-4 text-3xl font-semibold text-slate-900">
              {metric.value}
            </p>
            <p className="mt-2 text-xs text-slate-400">{metric.change}</p>
          </Card>
        ))}
      </section>

      {/* Processing Progress */}
      {progress.totalCases > 0 && (
        <section>
          <Card className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-4">
              Data Processing Pipeline
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Total Cases Ingested</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {progress.totalCases.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Classified</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {progress.classifiedCases.toLocaleString()}
                </p>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-teal-500 transition-all"
                    style={{
                      width: `${Math.min(100, (progress.classifiedCases / progress.totalCases) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {(
                    (progress.classifiedCases / progress.totalCases) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Entities Extracted</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {progress.casesWithEntities.toLocaleString()}
                </p>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-sky-500 transition-all"
                    style={{
                      width: `${Math.min(100, (progress.casesWithEntities / progress.totalCases) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {(
                    (progress.casesWithEntities / progress.totalCases) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
          </Card>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="group space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Alerts & escalations
              </h2>
              <p className="text-sm text-slate-500">
                Consolidated signals from intake pipelines and live monitoring.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info" className="uppercase tracking-wide">
                {alerts.length} active
              </Badge>
              <FeedbackButton feedbackId="dashboard.alerts" />
            </div>
          </div>
          <ul className="space-y-4">
            {alerts.length === 0 ? (
              <li className="text-sm italic text-slate-400">
                No active alerts — all monitoring signals are clear.
              </li>
            ) : (
              alerts.map((alert) => (
                <li
                  key={alert.id}
                  className="flex items-start justify-between gap-4 rounded-xl bg-slate-50/60 p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      <TextWithTokens text={alert.title} />
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      <TextWithTokens text={alert.detail} />
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={alert.variant}>{alert.time}</Badge>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
                    >
                      View details
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card className="group space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Activity feed
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="default">Last hour</Badge>
                <FeedbackButton feedbackId="dashboard.activity" />
              </div>
            </div>
            <ul className="space-y-4">
              {activity.length === 0 ? (
                <li className="text-sm italic text-slate-400">
                  No recent activity — the platform is quiet right now.
                </li>
              ) : (
                activity.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        <TextWithTokens text={item.title} />
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.actor} · {item.when}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </Card>
          <Card className="group space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Reminders
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="warning">Action needed</Badge>
                <FeedbackButton feedbackId="dashboard.reminders" />
              </div>
            </div>
            <div className="space-y-3 text-sm text-slate-500">
              {reminders.length === 0 ? (
                <p className="italic text-slate-400">
                  No pending reminders — you&apos;re all caught up.
                </p>
              ) : (
                reminders.map((reminder) => (
                  <p key={reminder.id} className="flex items-center gap-2">
                    {reminderIconMap[reminder.category] ?? (
                      <SignalHigh className="h-4 w-4 text-slate-400" />
                    )}
                    {reminder.text}
                  </p>
                ))
              )}
            </div>
          </Card>
        </div>
      </section>

      <section className="group">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Quick actions
          </h2>
          <div className="flex items-center gap-3">
            <Link
              href="/cases"
              className="text-sm font-semibold text-teal-600 hover:text-teal-700"
            >
              View all
            </Link>
            <FeedbackButton feedbackId="dashboard.actions" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Card
              key={action.href}
              padded={false}
              className="hover:border-teal-300"
            >
              <Link href={action.href} className="flex h-full flex-col p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-slate-300" />
                </div>
                <p className="mt-6 text-sm font-semibold text-slate-900">
                  {action.label}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {action.description}
                </p>
                <span className="mt-auto pt-6 text-xs font-semibold uppercase tracking-wide text-teal-600">
                  Open
                </span>
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

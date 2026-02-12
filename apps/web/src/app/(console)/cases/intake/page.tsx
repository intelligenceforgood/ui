import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { ShieldPlus } from "lucide-react";

const CaseIntakeForm = dynamic(() => import("./case-intake-form"), {
  loading: () => (
    <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
  ),
});

export const metadata: Metadata = {
  title: "New Case Intake",
  description: "Submit new signals or victim reports for analyst triage.",
};

export default function CaseIntakePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Intake
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
              Create a new case intake
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
              Capture the reporter context, incident details, and supporting
              files. We queue a background job to classify, extract entities,
              and route the case once submitted.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
            <ShieldPlus className="h-5 w-5 text-teal-500" />
            Secure submission · Encrypted at rest
          </div>
        </div>
      </header>

      <CaseIntakeForm />
    </div>
  );
}

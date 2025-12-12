import type { Metadata } from "next";
import { getAccountListRuns } from "@/lib/server/account-list-service";
import { AccountListConsole } from "./account-list-console";

export const metadata: Metadata = {
  title: "Account List",
  description: "Generate and review financial account extraction runs.",
};

export const dynamic = "force-dynamic";

export default async function AccountListPage() {
  const runs = await getAccountListRuns(8);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Financial indicators
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Account list extraction
        </h1>
        <p className="max-w-3xl text-sm text-slate-500">
          Launch manual runs across bank, crypto, and payment indicators. The
          console surfaces run summaries, warnings, and artifact links once
          extraction completes.
        </p>
      </header>

      <AccountListConsole initialRuns={runs} />
    </div>
  );
}

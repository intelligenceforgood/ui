import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { FeedbackButton } from "@i4g/ui-kit";
import { Breadcrumbs } from "@/components/breadcrumbs";

const EntityExplorer = nextDynamic(() => import("./entity-explorer"), {
  loading: () => (
    <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
  ),
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entity Explorer",
  description:
    "Search, filter, and drill into entities across all fraud cases.",
};

export default async function EntityExplorerPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="group relative space-y-8">
      <FeedbackButton
        feedbackId="intelligence.entities"
        className="absolute top-1 right-0 z-10"
      />
      <Breadcrumbs
        items={[
          { label: "Intelligence", href: "/intelligence" },
          { label: "Entity Explorer" },
        ]}
      />
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Intelligence
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
          Entity Explorer
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Browse and search entities identified across fraud cases. Filter by
          type, activity, risk level, or campaign to focus your investigation.
        </p>
      </header>

      <EntityExplorer initialParams={searchParams ?? {}} />
    </div>
  );
}

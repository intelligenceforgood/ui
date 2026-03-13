import type { Metadata } from "next";
import nextDynamic from "next/dynamic";

const IndicatorRegistry = nextDynamic(() => import("./indicator-registry"), {
  loading: () => (
    <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
  ),
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Indicator Registry",
  description: "Browse financial and network indicators segmented by category.",
};

export default async function IndicatorRegistryPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Intelligence
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
          Indicator Registry
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Persistent, always-on view of financial and network indicators
          extracted across all cases. Filter by category, export selections, or
          submit to eCrimeX.
        </p>
      </header>

      <IndicatorRegistry initialParams={searchParams ?? {}} />
    </div>
  );
}

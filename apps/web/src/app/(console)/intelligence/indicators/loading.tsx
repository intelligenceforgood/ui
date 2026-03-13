export default function IndicatorRegistryLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-96 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

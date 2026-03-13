export default function ImpactLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-96 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

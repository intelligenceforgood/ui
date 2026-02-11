export default function TaxonomyLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <header className="space-y-3">
        <div className="h-4 w-20 rounded bg-slate-200" />
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="h-4 w-72 rounded bg-slate-200" />
      </header>

      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-100 bg-white/80 p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-200" />
              <div className="h-5 w-40 rounded bg-slate-200" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(4)].map((_, j) => (
                <div
                  key={j}
                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2"
                >
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="h-4 w-full rounded bg-slate-100" />
                  <div className="h-4 w-3/4 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

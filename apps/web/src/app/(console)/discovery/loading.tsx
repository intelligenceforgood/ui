export default function DiscoveryLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <header className="space-y-3">
        <div className="h-4 w-20 rounded bg-slate-200" />
        <div className="h-8 w-56 rounded bg-slate-200" />
        <div className="h-4 w-80 rounded bg-slate-200" />
      </header>

      <div className="rounded-2xl border border-slate-100 bg-white/80 p-6 space-y-6">
        <div className="h-11 w-full rounded-xl bg-slate-200" />

        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-4">
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 w-full rounded bg-slate-100" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-100 bg-white/80 p-6 space-y-3"
              >
                <div className="h-5 w-64 rounded bg-slate-200" />
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-5/6 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

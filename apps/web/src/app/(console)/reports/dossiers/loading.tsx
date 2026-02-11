export default function DossiersLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <header className="space-y-3">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-8 w-56 rounded bg-slate-200" />
        <div className="h-4 w-96 rounded bg-slate-200" />
      </header>

      <div className="flex flex-wrap gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-slate-200" />
        ))}
      </div>

      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-slate-100 bg-white/80 p-6 space-y-5"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="h-3 w-12 rounded bg-slate-200" />
                <div className="h-7 w-48 rounded bg-slate-200" />
                <div className="h-4 w-64 rounded bg-slate-100" />
              </div>
              <div className="h-6 w-20 rounded-full bg-slate-200" />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, j) => (
                <div
                  key={j}
                  className="rounded-2xl border border-slate-100 bg-white/70 px-4 py-3"
                >
                  <div className="h-3 w-16 rounded bg-slate-200" />
                  <div className="mt-2 h-5 w-12 rounded bg-slate-200" />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="h-10 w-36 rounded-full bg-slate-200" />
              <div className="h-10 w-36 rounded-full bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

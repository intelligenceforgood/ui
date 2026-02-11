export default function CasesLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-9 w-72 rounded bg-slate-200" />
          <div className="h-4 w-96 rounded bg-slate-200" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 rounded-full bg-slate-200" />
          <div className="h-10 w-36 rounded-full bg-slate-200" />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-100 bg-white/80 p-6"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-slate-200" />
              <div className="space-y-2">
                <div className="h-4 w-20 rounded bg-slate-200" />
                <div className="h-6 w-10 rounded bg-slate-200" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-100 bg-white/80 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="h-5 w-16 rounded bg-slate-200" />
            <div className="h-6 w-20 rounded-full bg-slate-200" />
          </div>
          <div className="divide-y divide-slate-100">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-6 py-4 space-y-3">
                <div className="flex gap-2">
                  <div className="h-6 w-24 rounded-full bg-slate-100" />
                  <div className="h-6 w-20 rounded-full bg-slate-100" />
                </div>
                <div className="h-5 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-48 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-16 rounded bg-slate-200" />
            <div className="h-6 w-16 rounded-full bg-slate-200" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl border border-slate-100 bg-slate-50/50 p-4"
              >
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="mt-2 h-4 w-full rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-9 w-80 rounded bg-slate-200" />
          <div className="h-4 w-96 rounded bg-slate-200" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-44 rounded-full bg-slate-200" />
          <div className="h-10 w-40 rounded-full bg-slate-200" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-slate-100 bg-white/80 p-6"
          >
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="mt-4 h-8 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="h-80 rounded-2xl border border-slate-100 bg-white/80 p-6">
          <div className="h-5 w-40 rounded bg-slate-200" />
          <div className="mt-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="h-52 rounded-2xl border border-slate-100 bg-white/80 p-6">
            <div className="h-5 w-28 rounded bg-slate-200" />
            <div className="mt-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 rounded bg-slate-100" />
              ))}
            </div>
          </div>
          <div className="h-36 rounded-2xl border border-slate-100 bg-white/80 p-6">
            <div className="h-5 w-24 rounded bg-slate-200" />
            <div className="mt-4 space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-4 w-full rounded bg-slate-100" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="h-5 w-28 rounded bg-slate-200" />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-slate-100 bg-white/80 p-6"
            >
              <div className="h-10 w-10 rounded-full bg-slate-200" />
              <div className="mt-6 h-4 w-32 rounded bg-slate-200" />
              <div className="mt-2 h-4 w-48 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

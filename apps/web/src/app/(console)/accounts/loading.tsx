export default function AccountsLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <header className="space-y-3">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="h-8 w-56 rounded bg-slate-200" />
        <div className="h-4 w-80 rounded bg-slate-200" />
      </header>

      <div className="h-11 w-full rounded-xl bg-slate-200" />

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-100 bg-white/80 p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-48 rounded bg-slate-200" />
              <div className="h-6 w-16 rounded-full bg-slate-200" />
            </div>
            <div className="h-4 w-64 rounded bg-slate-100" />
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-slate-100" />
              <div className="h-6 w-24 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

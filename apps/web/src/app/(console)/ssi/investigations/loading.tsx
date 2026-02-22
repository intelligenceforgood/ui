export default function InvestigationsLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-9 w-64 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-96 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-10 w-40 rounded-full bg-slate-200 dark:bg-slate-700" />
      </header>
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 rounded-full bg-slate-200 dark:bg-slate-700"
          />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-slate-100 bg-white/80 dark:border-slate-800 dark:bg-slate-900/40 p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-3 w-72 rounded bg-slate-200 dark:bg-slate-700 mb-2" />
            <div className="flex gap-4">
              <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

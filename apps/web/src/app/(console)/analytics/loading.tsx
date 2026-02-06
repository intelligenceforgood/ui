export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <header className="space-y-4">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="h-4 w-96 rounded bg-slate-200" />
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-slate-200" />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="h-80 rounded-lg bg-slate-200" />
        <div className="h-80 rounded-lg bg-slate-200" />
      </section>
    </div>
  );
}

import { Card } from "@i4g/ui-kit";

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <header className="space-y-3">
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="h-9 w-96 bg-slate-200 rounded" />
        <div className="space-y-2 pt-1">
          <div className="h-4 w-full max-w-2xl bg-slate-200 rounded" />
          <div className="h-4 w-full max-w-lg bg-slate-200 rounded" />
        </div>
      </header>

      {/* Stats Card Skeleton */}
      <Card className="flex flex-col gap-3 border-slate-100 p-6">
        <div className="h-5 w-64 bg-slate-200 rounded" />
        <div className="flex flex-wrap gap-2">
          <div className="h-5 w-24 bg-slate-200 rounded-full" />
          <div className="h-5 w-28 bg-slate-200 rounded-full" />
          <div className="h-5 w-20 bg-slate-200 rounded-full" />
        </div>
      </Card>

      {/* Search Experience Skeleton Main Layout */}
      <div className="space-y-6">
        {/* Search Bar Area */}
        <div className="flex gap-4">
          <div className="h-11 grow bg-slate-200 rounded-md" />
          <div className="h-11 w-32 bg-slate-200 rounded-md" />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-3 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="space-y-2">
                  <div className="h-8 w-full bg-slate-200 rounded" />
                  <div className="h-8 w-full bg-slate-200 rounded" />
                  <div className="h-8 w-full bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Results Feed */}
          <div className="lg:col-span-9 space-y-4">
            <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
            {[1, 2, 3].map((i) => (
              <Card key={i} className="space-y-4 p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 w-2/3">
                    <div className="h-5 w-1/3 bg-slate-200 rounded" />
                    <div className="h-6 w-3/4 bg-slate-200 rounded" />
                  </div>
                  <div className="h-8 w-8 bg-slate-200 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-slate-200 rounded" />
                  <div className="h-4 w-5/6 bg-slate-200 rounded" />
                </div>
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-20 bg-slate-200 rounded-full" />
                  <div className="h-6 w-20 bg-slate-200 rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

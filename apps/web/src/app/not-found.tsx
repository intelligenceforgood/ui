import Link from "next/link";

/**
 * Root-level 404 page.  Shown when no route matches the requested URL.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white/80 p-8 text-center shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
          <span className="text-2xl font-bold" aria-hidden="true">
            ?
          </span>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Page not found
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-teal-300 hover:text-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-teal-500 dark:hover:text-teal-400"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

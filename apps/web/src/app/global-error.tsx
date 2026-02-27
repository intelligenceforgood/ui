"use client";

/**
 * Root error boundary that wraps the entire application, including the root
 * layout.  Next.js App Router requires this file to handle errors that
 * originate in `layout.tsx` itself (fonts, theme provider, etc.).
 *
 * Because `global-error` replaces the root layout on error, it must render
 * its own `<html>` and `<body>` tags.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 font-sans antialiased">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md space-y-6 rounded-2xl border border-rose-100 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-900">
                Application error
              </h2>
              <p className="text-sm text-slate-500">
                A critical error prevented the page from loading. Please try
                again or contact support if the problem persists.
              </p>
            </div>
            {error.digest && (
              <p className="text-xs text-slate-400">Error ID: {error.digest}</p>
            )}
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-teal-300 hover:text-teal-600"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

import { ShieldAlert } from "lucide-react";
import Link from "next/link";

interface RestrictedAccessProps {
  /** Title shown above the description. */
  title?: string;
  /** Explanation of why access is denied. */
  description?: string;
  /** Path for the "Go back" link. Defaults to `/` (dashboard). */
  backHref?: string;
  /** Label for the back link. */
  backLabel?: string;
}

/**
 * Full-page notice for researcher-role users who attempt to open a
 * detail view they are not authorized to see.
 */
export function RestrictedAccess({
  title = "Access restricted",
  description = "Your account does not have permission to view this page. Researcher accounts can access aggregate dashboards and anonymized exports but not individual case or entity details.",
  backHref = "/",
  backLabel = "Return to dashboard",
}: RestrictedAccessProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-amber-100 bg-white/80 p-8 text-center shadow-sm backdrop-blur dark:border-amber-900 dark:bg-slate-900/80">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {description}
        </p>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
        >
          &larr; {backLabel}
        </Link>
      </div>
    </div>
  );
}

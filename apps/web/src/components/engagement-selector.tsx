"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Check, Settings, Globe } from "lucide-react";
import { Badge } from "@i4g/ui-kit";
import { useEngagement } from "@/lib/engagement-context";
import { useAuth } from "@/lib/auth-context";
import { clsx } from "clsx";

const statusVariant: Record<
  string,
  "success" | "default" | "warning" | "info"
> = {
  active: "success",
  draft: "default",
  completed: "info",
  archived: "warning",
};

export function EngagementSelector() {
  const { engagement, engagements, select, clear, loading } = useEngagement();
  const { hasRole } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (loading) return null;
  if (engagements.length === 0) return null;

  const active = engagements.filter((e) => e.status === "active");
  const past = engagements.filter(
    (e) => e.status !== "active" && e.status !== "draft",
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {engagement ? (
          <>
            <span className="max-w-[200px] truncate">{engagement.name}</span>
            <Badge
              variant={statusVariant[engagement.status] ?? "default"}
              className="text-[10px]"
            >
              {engagement.status}
            </Badge>
          </>
        ) : (
          <>
            <Globe className="h-3.5 w-3.5" />
            All Engagements
          </>
        )}
        <ChevronDown
          className={clsx("h-3.5 w-3.5 transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="max-h-80 overflow-y-auto p-2">
            {/* All Engagements option — manager+ and admin only */}
            {hasRole("manager") && (
              <button
                type="button"
                onClick={() => {
                  clear();
                  setOpen(false);
                }}
                className={clsx(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                  !engagement
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60",
                )}
              >
                <Globe className="h-4 w-4" />
                All Engagements
                {!engagement && (
                  <Check className="ml-auto h-4 w-4 text-teal-500" />
                )}
              </button>
            )}

            {/* Active engagements */}
            {active.length > 0 && (
              <>
                <p className="mt-2 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Active
                </p>
                {active.map((eng) => (
                  <button
                    key={eng.engagementId}
                    type="button"
                    onClick={() => {
                      select(eng.engagementId);
                      setOpen(false);
                    }}
                    className={clsx(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                      engagement?.engagementId === eng.engagementId
                        ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60",
                    )}
                  >
                    <span className="truncate">{eng.name}</span>
                    {engagement?.engagementId === eng.engagementId && (
                      <Check className="ml-auto h-4 w-4 flex-shrink-0 text-teal-500" />
                    )}
                  </button>
                ))}
              </>
            )}

            {/* Past engagements */}
            {past.length > 0 && (
              <>
                <p className="mt-2 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Past
                </p>
                {past.map((eng) => (
                  <button
                    key={eng.engagementId}
                    type="button"
                    onClick={() => {
                      select(eng.engagementId);
                      setOpen(false);
                    }}
                    className={clsx(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                      engagement?.engagementId === eng.engagementId
                        ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60",
                    )}
                  >
                    <span className="truncate">{eng.name}</span>
                    <Badge variant="info" className="ml-auto text-[10px]">
                      {eng.status}
                    </Badge>
                    {engagement?.engagementId === eng.engagementId && (
                      <Check className="h-4 w-4 flex-shrink-0 text-teal-500" />
                    )}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Manage link for manager+ */}
          {hasRole("manager") && (
            <div className="border-t border-slate-100 p-2 dark:border-slate-800">
              <Link
                href="/admin/engagements"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
              >
                <Settings className="h-4 w-4" />
                Manage Engagements
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Laptop, Moon, Settings, Shield, Sun } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

export function UserPreferences() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = theme ?? "system";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      {/* User identity */}
      {user && (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 shrink-0 text-slate-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
              {user.displayName || user.email}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {user.role}
            </p>
          </div>
        </div>
      )}

      {/* Divider */}
      {user && (
        <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
      )}

      {/* Compact theme switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <Settings className="h-3 w-3" />
          <span>Theme</span>
        </div>
        {mounted ? (
          <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = activeTheme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  title={option.label}
                  onClick={() => setTheme(option.value)}
                  className={
                    "rounded-md p-1.5 transition " +
                    (isActive
                      ? "bg-white text-teal-600 shadow-sm dark:bg-slate-700 dark:text-teal-400"
                      : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300")
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="h-7 w-24 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        )}
      </div>
    </div>
  );
}

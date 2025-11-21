"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Laptop, Moon, Sun } from "lucide-react";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/70">
        Loading theme…
      </div>
    );
  }

  const activeTheme = theme ?? "system";
  const resolvedSystemTheme = systemTheme ?? "light";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
        Appearance
      </p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {activeTheme === "system" ? `System (${resolvedSystemTheme})` : `Theme: ${activeTheme}`}
      </p>
      <div className="mt-3 grid gap-2">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isActive = activeTheme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={
                "flex items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition " +
                (isActive
                  ? "border-teal-400 bg-white text-teal-700 shadow"
                  : "border-slate-200 bg-white/70 text-slate-500 hover:border-teal-200 dark:border-slate-800 dark:bg-slate-900/80")
              }
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

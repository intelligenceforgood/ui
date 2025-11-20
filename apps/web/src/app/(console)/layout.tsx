"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  HelpCircle,
  LayoutDashboard,
  Search,
  CaseSensitive,
  Layers,
  LineChart,
  Menu,
} from "lucide-react";
import { useState } from "react";
import "../globals.css";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search", label: "Search", icon: Search },
  { href: "/cases", label: "Cases & Tasks", icon: CaseSensitive },
  { href: "/taxonomy", label: "Taxonomy", icon: Layers },
  { href: "/analytics", label: "Analytics", icon: LineChart },
];

function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = (
    <ul className="space-y-2">
      {navItems.map(({ href, label, icon: Icon }) => (
        <li key={href}>
          <Link
            className={clsx(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
              pathname.startsWith(href)
                ? "bg-slate-900 text-white shadow-lg"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/70"
            )}
            href={href}
            onClick={() => setMobileOpen(false)}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Toggle navigation"
        className="lg:hidden fixed top-4 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg"
        onClick={() => setMobileOpen((open) => !open)}
      >
        <Menu className="h-5 w-5" />
      </button>
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-100 bg-white/90 backdrop-blur transition-transform duration-300 lg:static lg:translate-x-0 lg:flex lg:flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-20 flex items-center px-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-400 shadow-lg" />
            <div>
              <p className="text-sm text-slate-500">Intelligence for Good</p>
              <p className="text-lg font-semibold text-slate-900">Analyst Console</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-8 overflow-y-auto">{navLinks}</nav>
        <div className="px-6 pb-8">
          <Link
            href="https://docs.intelligenceforgood.org/book/guides"
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:border-teal-300 hover:text-teal-600"
            onClick={() => setMobileOpen(false)}
          >
            <HelpCircle className="h-4 w-4" />
            Analyst guide
          </Link>
        </div>
      </aside>
    </>
  );
}

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="flex flex-col lg:flex-row">
        <Navigation />
        <main className="flex-1 min-h-screen px-4 py-6 sm:px-10 lg:px-12 lg:py-10">
          <div className="mx-auto w-full max-w-6xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

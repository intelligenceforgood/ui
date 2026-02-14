"use client";

import { useState } from "react";
import Image from "next/image";
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
  Globe,
  ListChecks,
  FileCheck2,
  Shield,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth, type UserRole } from "@/lib/auth-context";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Minimum role required to see this item. Omit for all authenticated users. */
  minRole?: UserRole;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search", label: "Search", icon: Search },
  { href: "/accounts", label: "Account list", icon: ListChecks },
  { href: "/discovery", label: "Discovery", icon: Globe },
  { href: "/cases", label: "Cases & Tasks", icon: CaseSensitive },
  {
    href: "/reports/dossiers",
    label: "Evidence dossiers",
    icon: FileCheck2,
    minRole: "analyst",
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    icon: Layers,
    minRole: "admin",
  },
  { href: "/taxonomy", label: "Taxonomy", icon: Layers },
  {
    href: "/analytics",
    label: "Analytics",
    icon: LineChart,
    minRole: "analyst",
  },
  {
    href: "/admin/users",
    label: "User management",
    icon: Users,
    minRole: "admin",
  },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, hasRole } = useAuth();

  const visibleItems = navItems.filter(
    (item) => !item.minRole || hasRole(item.minRole),
  );

  const navLinks = (
    <ul className="space-y-2">
      {visibleItems.map(({ href, label, icon: Icon }) => (
        <li key={href}>
          <Link
            className={clsx(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
              pathname.startsWith(href)
                ? "bg-slate-900 text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/60",
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
        className="lg:hidden fixed top-4 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg dark:bg-slate-200 dark:text-slate-900"
        onClick={() => setMobileOpen((open) => !open)}
      >
        <Menu className="h-5 w-5" />
      </button>
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-100 bg-white/90 backdrop-blur transition-transform duration-300 dark:border-slate-900 dark:bg-slate-950/80 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:flex lg:flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="h-20 flex items-center px-8 border-b border-slate-100 dark:border-slate-900">
          <div className="flex items-center gap-3">
            <Image
              src="/ifg-logomark.svg"
              alt="Intelligence for Good logomark"
              width={40}
              height={40}
              priority
              className="h-10 w-10 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-900"
            />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Intelligence for Good
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                Analyst Console
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-8 overflow-y-auto">{navLinks}</nav>
        <div className="px-6 pb-8 space-y-4">
          {/* User identity badge */}
          {user && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900/60">
              <Shield className="h-4 w-4 text-slate-400" />
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
          <ThemeToggle />
          <Link
            href="https://docs.intelligenceforgood.org/book/guides"
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-teal-300 hover:text-teal-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
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

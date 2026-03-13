"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Network, ListChecks, Layers, ArrowRight } from "lucide-react";

const SHORTCUTS = [
  {
    label: "Search Cases",
    href: "/search",
    icon: Search,
    description: "Full-text search across all cases",
  },
  {
    label: "Entity Explorer",
    href: "/intelligence/entities",
    icon: Network,
    description: "Browse entities by type, risk, and activity",
  },
  {
    label: "Indicator Registry",
    href: "/intelligence/indicators",
    icon: ListChecks,
    description: "Financial and network indicators",
  },
  {
    label: "Campaigns",
    href: "/intelligence/campaigns",
    icon: Layers,
    description: "Threat campaign tracking",
  },
];

const ENTITY_TYPES = [
  "person",
  "phone",
  "email",
  "crypto_wallet",
  "bank_account",
  "ip_address",
  "domain",
  "organization",
];

const INDICATOR_CATEGORIES = [
  "bank_account",
  "crypto_wallet",
  "payment",
  "ip_address",
  "domain",
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen((o) => !o);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const q = query.toLowerCase().trim();

  // Build filtered results
  const filteredShortcuts = SHORTCUTS.filter(
    (s) =>
      !q ||
      s.label.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q),
  );

  const entityTypeResults = q
    ? ENTITY_TYPES.filter((t) => t.includes(q)).map((t) => ({
        label: `Entities: ${t}`,
        href: `/intelligence/entities?entity_type=${t}`,
        icon: Network,
        description: `Browse ${t} entities`,
      }))
    : [];

  const indicatorResults = q
    ? INDICATOR_CATEGORIES.filter((c) => c.includes(q)).map((c) => ({
        label: `Indicators: ${c}`,
        href: `/intelligence/indicators?category=${c}`,
        icon: ListChecks,
        description: `Browse ${c} indicators`,
      }))
    : [];

  const allResults = [
    ...filteredShortcuts,
    ...entityTypeResults,
    ...indicatorResults,
  ];

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(allResults.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && allResults[activeIndex]) {
      navigate(allResults[activeIndex].href);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        onKeyDown={() => {}}
        role="presentation"
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(e) => handleItemKeyDown(e)}
            placeholder="Search pages, entities, indicators…"
            className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
          <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline dark:border-slate-700">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {allResults.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-400">
              No results found
            </p>
          ) : (
            <ul>
              {allResults.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                        idx === activeIndex
                          ? "bg-teal-50 text-teal-900 dark:bg-teal-900/30 dark:text-teal-200"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                      <div className="flex-1">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-slate-400">
                          {item.description}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

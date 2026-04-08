"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Engagement } from "@i4g/sdk";
import {
  getEngagementCookie,
  setEngagementCookie,
  setAllEngagementsCookie,
  ALL_ENGAGEMENTS,
} from "./engagement-cookie";

interface EngagementContextValue {
  /** Currently selected engagement, or null for "All Engagements" mode. */
  engagement: Engagement | null;
  /** All available engagements (fetched on mount or passed as initial data). */
  engagements: Engagement[];
  /** Select an engagement by ID. Updates cookie and triggers router refresh. */
  select: (id: string) => void;
  /** Clear engagement selection ("All Engagements" mode). */
  clear: () => void;
  /** Whether the engagement list is still loading. */
  loading: boolean;
}

const EngagementContext = createContext<EngagementContextValue>({
  engagement: null,
  engagements: [],
  select: () => {},
  clear: () => {},
  loading: true,
});

interface EngagementProviderProps {
  children: ReactNode;
  /** Server-fetched engagement list to avoid loading flash. */
  initialEngagements?: Engagement[];
}

export function EngagementProvider({
  children,
  initialEngagements,
}: EngagementProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [engagements, setEngagements] = useState<Engagement[]>(
    initialEngagements ?? [],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialEngagements);

  // Fetch engagements client-side if no initial data was provided.
  useEffect(() => {
    if (initialEngagements) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/engagements");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setEngagements(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialEngagements]);

  // On mount: resolve initial selection from URL param → cookie → auto-select.
  useEffect(() => {
    const urlEngagement = searchParams.get("engagement");
    const cookieEngagement = getEngagementCookie();
    const resolved = urlEngagement ?? cookieEngagement;

    // User explicitly chose "All Engagements" — respect that.
    if (resolved === ALL_ENGAGEMENTS) {
      setSelectedId(null);
      return;
    }

    if (resolved && engagements.some((e) => e.engagementId === resolved)) {
      setSelectedId(resolved);
      setEngagementCookie(resolved);
    } else if (engagements.length === 1) {
      // Auto-select if only one active engagement
      const single = engagements.find((e) => e.status === "active");
      if (single) {
        setSelectedId(single.engagementId);
        setEngagementCookie(single.engagementId);
      }
    }
  }, [engagements, searchParams]);

  const select = useCallback(
    (id: string) => {
      setSelectedId(id);
      setEngagementCookie(id);
      // Update URL query param without full navigation
      const params = new URLSearchParams(searchParams.toString());
      params.set("engagement", id);
      router.replace(`?${params.toString()}`);
      router.refresh(); // Re-run server components with new cookie
    },
    [router, searchParams],
  );

  const clear = useCallback(() => {
    setSelectedId(null);
    setAllEngagementsCookie();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("engagement");
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname);
    router.refresh();
  }, [router, searchParams]);

  const engagement =
    engagements.find((e) => e.engagementId === selectedId) ?? null;

  return (
    <EngagementContext.Provider
      value={{ engagement, engagements, select, clear, loading }}
    >
      {children}
    </EngagementContext.Provider>
  );
}

export function useEngagement(): EngagementContextValue {
  return useContext(EngagementContext);
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Button, Badge } from "@i4g/ui-kit";
import type { GeographySummary, CountryDetailResponse } from "@i4g/sdk";
import { ChevronRight, Globe, X } from "lucide-react";

export default function GeographyView() {
  const [summaries, setSummaries] = useState<GeographySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("90d");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [detail, setDetail] = useState<CountryDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/impact/geography?period=${period}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSummaries(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const fetchDetail = useCallback(
    async (country: string) => {
      setSelectedCountry(country);
      setDetailLoading(true);
      try {
        const res = await fetch(
          `/api/impact/geography/${encodeURIComponent(country)}?period=${period}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setDetail(await res.json());
      } catch {
        setDetail(null);
      } finally {
        setDetailLoading(false);
      }
    },
    [period],
  );

  const totalCases = summaries.reduce((a, b) => a + b.caseCount, 0);
  const totalLoss = summaries.reduce((a, b) => a + b.totalLoss, 0);
  const maxCases = Math.max(1, ...summaries.map((s) => s.caseCount));

  return (
    <div className="space-y-4">
      {/* Period control */}
      <Card className="flex items-center gap-3 p-3">
        <Globe className="h-4 w-4 text-slate-400" />
        {(["30d", "90d", "quarter", "year"] as const).map((p) => (
          <Button
            key={p}
            size="sm"
            variant={period === p ? "primary" : "ghost"}
            onClick={() => setPeriod(p)}
          >
            {p}
          </Button>
        ))}
      </Card>

      {loading && (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600" />
        </div>
      )}

      {error && <Card className="p-4 text-red-500">{error}</Card>}

      {!loading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Summary cards */}
          <Card className="p-4 text-center">
            <p className="text-sm font-medium text-slate-500">Countries</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">
              {summaries.length}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm font-medium text-slate-500">Total Cases</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">
              {totalCases.toLocaleString()}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm font-medium text-slate-500">Total Loss</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">
              $
              {totalLoss.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </p>
          </Card>
        </div>
      )}

      {!loading && summaries.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Country list */}
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
              Countries by Case Volume
            </h3>
            <div className="space-y-2">
              {summaries
                .sort((a, b) => b.caseCount - a.caseCount)
                .map((s) => (
                  <button
                    key={s.country}
                    onClick={() => fetchDetail(s.country)}
                    className={`flex w-full items-center gap-3 rounded p-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      selectedCountry === s.country
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    <span className="w-12 text-sm font-medium">
                      {s.country}
                    </span>
                    <div className="flex-1">
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${(s.caseCount / maxCases) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="w-16 text-right text-xs text-slate-500">
                      {s.caseCount} cases
                    </span>
                    <span className="w-20 text-right text-xs text-slate-400">
                      $
                      {s.totalLoss.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </button>
                ))}
            </div>
          </Card>

          {/* Country detail slide-over */}
          <Card className="p-4">
            {!selectedCountry && (
              <div className="flex h-48 items-center justify-center text-sm text-slate-400">
                Select a country to view details
              </div>
            )}
            {selectedCountry && detailLoading && (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600" />
              </div>
            )}
            {detail && !detailLoading && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    {detail.country} Detail
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedCountry(null);
                      setDetail(null);
                    }}
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
                <div className="mb-3 flex gap-4 text-xs text-slate-500">
                  <span>{detail.totalCases} cases</span>
                  <span>
                    $
                    {detail.totalLoss.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{" "}
                    total loss
                  </span>
                </div>
                <div className="max-h-80 space-y-1 overflow-y-auto">
                  {detail.records.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded border border-slate-100 px-2 py-1 text-xs dark:border-slate-700"
                    >
                      <span className="font-mono text-slate-600 dark:text-slate-300">
                        {r.caseId}
                      </span>
                      {r.category && (
                        <Badge
                          variant="default"
                          title={r.categoryCode ?? r.category}
                        >
                          {r.category}
                        </Badge>
                      )}
                      <span>
                        $
                        {r.lossAmount.toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

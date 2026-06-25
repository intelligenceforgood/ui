"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { Card, Button, Badge } from "@i4g/ui-kit";
import type { GeographySummary, CountryDetailResponse } from "@i4g/sdk";
import { Globe, X } from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import countriesData from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countriesData.registerLocale(enLocale);

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function GeographyView({
  initialSummaries,
}: {
  initialSummaries: GeographySummary[];
}) {
  const [summaries, setSummaries] =
    useState<GeographySummary[]>(initialSummaries);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("90d");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [detail, setDetail] = useState<CountryDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");

  const fetchSummary = useCallback(async (currentPeriod: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/impact/geography?period=${currentPeriod}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSummaries(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch if period changes from default or if we don't have initialSummaries
    if (period !== "90d" || !initialSummaries.length) {
      fetchSummary(period);
    }
  }, [period, fetchSummary, initialSummaries]);

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

  // Pre-calculate country metrics mapped by numeric ID for the map
  const mapData = useMemo(() => {
    const data: Record<string, GeographySummary> = {};
    for (const summary of summaries) {
      // Assuming summary.country is ISO A2 like "US", "GB", etc.
      const numericId = countriesData.alpha2ToNumeric(summary.country);
      if (numericId) {
        data[numericId] = summary;
      }
    }
    return data;
  }, [summaries]);

  const getCountryName = (isoA2: string) => {
    return countriesData.getName(isoA2, "en") || isoA2;
  };

  const selectedSummary = useMemo(() => {
    return summaries.find((s) => s.country === selectedCountry);
  }, [summaries, selectedCountry]);

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
            <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">
              {summaries.length}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm font-medium text-slate-500">Total Cases</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">
              {totalCases.toLocaleString()}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm font-medium text-slate-500">Total Loss</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">
              $
              {totalLoss.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </p>
          </Card>
        </div>
      )}

      {!loading && summaries.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Map view taking 2/3 of the width on large screens */}
          <Card className="p-4 lg:col-span-2 relative overflow-hidden">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
              Global Impact Map
            </h3>
            <div className="aspect-video w-full rounded-lg bg-slate-50 dark:bg-slate-900 relative border border-slate-100 dark:border-slate-800">
              {tooltipContent && (
                <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs px-3 py-2 rounded-md shadow-xs text-sm border border-slate-200 dark:border-slate-700 pointer-events-none">
                  {tooltipContent}
                </div>
              )}
              <ComposableMap
                projectionConfig={{
                  scale: 150,
                }}
                className="w-full h-full"
              >
                <ZoomableGroup>
                  <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const numericId = geo.id as string;
                        const countryData = mapData[numericId];
                        const caseCount = countryData?.caseCount || 0;

                        // Linear scale for choropleth from blue-100 to blue-600
                        const intensity =
                          maxCases > 0 ? caseCount / maxCases : 0;
                        const fill =
                          caseCount > 0
                            ? `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`
                            : "#e2e8f0"; // slate-200 for empty

                        const darkFill =
                          caseCount > 0
                            ? `rgba(59, 130, 246, ${0.4 + intensity * 0.6})`
                            : "#334155"; // slate-700 for empty dark mode

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            fill={fill}
                            className="dark:fill-(--dark-fill) stroke-white dark:stroke-slate-900 stroke-[0.5] outline-hidden transition-colors"
                            style={{
                              default: {
                                outline: "none",
                                "--dark-fill": darkFill,
                              } as React.CSSProperties,
                              hover: {
                                fill: "#2563eb",
                                outline: "none",
                                "--dark-fill": "#3b82f6",
                              } as React.CSSProperties,
                              pressed: {
                                fill: "#1d4ed8",
                                outline: "none",
                                "--dark-fill": "#2563eb",
                              } as React.CSSProperties,
                            }}
                            onMouseEnter={() => {
                              if (countryData) {
                                setTooltipContent(
                                  `${getCountryName(countryData.country)}: ${countryData.caseCount} cases ($${countryData.totalLoss.toLocaleString()})`,
                                );
                              } else {
                                setTooltipContent(
                                  `${geo.properties.name}: No data`,
                                );
                              }
                            }}
                            onMouseLeave={() => {
                              setTooltipContent("");
                            }}
                            onClick={() => {
                              if (countryData) {
                                fetchDetail(countryData.country);
                              } else {
                                // Can try to reverse lookup but usually we only care about data we have
                                const a2 =
                                  countriesData.numericToAlpha2(numericId);
                                if (a2) fetchDetail(a2);
                              }
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-4 max-h-48 overflow-y-auto">
              <div className="flex-1 space-y-2 pr-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Top Countries
                </h4>
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
                      <span
                        className="w-24 text-sm font-medium truncate"
                        title={getCountryName(s.country)}
                      >
                        {getCountryName(s.country)}
                      </span>
                      <div className="flex-1">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{
                              width: `${(s.caseCount / maxCases) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="w-16 text-right text-xs text-slate-500">
                        {s.caseCount}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          </Card>

          {/* Country detail slide-over / sidebar */}
          <Card className="p-4 flex flex-col">
            {!selectedCountry && (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-400 text-center p-8">
                Select a country on the map or list to view details
              </div>
            )}
            {selectedCountry && detailLoading && (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600" />
              </div>
            )}
            {detail && !detailLoading && (
              <div className="flex flex-col h-full">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {getCountryName(detail.country)}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedCountry(null);
                      setDetail(null);
                    }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Total Cases</p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white">
                      {detail.totalCases.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Total Victims</p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white">
                      {selectedSummary?.victimCount?.toLocaleString() ?? "-"}
                    </p>
                  </div>
                  <div className="col-span-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-500 mb-1">Total Loss</p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white">
                      $
                      {detail.totalLoss.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>

                <h4 className="text-sm font-semibold mb-3 text-slate-900 dark:text-white">
                  Recent Cases
                </h4>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-80">
                  {detail.records.map((r, i) => (
                    <div
                      key={i}
                      className="flex flex-col rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-medium text-slate-600 dark:text-slate-300">
                          {r.caseId}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          $
                          {r.lossAmount.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        {r.category ? (
                          <Badge
                            variant="default"
                            title={r.categoryCode ?? r.category}
                            className="text-[10px] py-0 px-2"
                          >
                            {r.category}
                          </Badge>
                        ) : (
                          <span />
                        )}
                        {r.createdAt && (
                          <span className="text-[10px] text-slate-400">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {detail.records.length === 0 && (
                    <div className="text-center text-sm text-slate-500 py-4">
                      No case records found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

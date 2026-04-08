"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Card, FeedbackButton } from "@i4g/ui-kit";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BrandSeriesEntry {
  brand: string;
  date: string;
  count: number;
  [key: string]: unknown;
}

interface WalletTopEntry {
  token_symbol: string;
  network_short: string;
  wallet_address: string;
  count: number;
  [key: string]: unknown;
}

interface CurrencyEntry {
  token_symbol: string;
  count: number;
  [key: string]: unknown;
}

interface GeoEntry {
  country: string;
  count: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const BRAND_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#ea580c",
  "#9333ea",
  "#0891b2",
  "#ca8a04",
  "#be185d",
];

const PIE_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#06b6d4",
  "#eab308",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrendDashboardPage() {
  const [brandSeries, setBrandSeries] = useState<BrandSeriesEntry[]>([]);
  const [topWallets, setTopWallets] = useState<WalletTopEntry[]>([]);
  const [currencyBreakdown, setCurrencyBreakdown] = useState<CurrencyEntry[]>(
    [],
  );
  const [geoData, setGeoData] = useState<GeoEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [brandRes, walletRes, geoRes] = await Promise.all([
        fetch("/api/ssi/ecx/stats/phish-by-brand?days=30"),
        fetch("/api/ssi/ecx/stats/wallet-heatmap?limit=20"),
        fetch("/api/ssi/ecx/stats/geo-infrastructure?days=90"),
      ]);

      if (brandRes.ok) {
        const data = (await brandRes.json()) as {
          series: BrandSeriesEntry[];
        };
        setBrandSeries(data.series ?? []);
      }
      if (walletRes.ok) {
        const data = (await walletRes.json()) as {
          top_wallets: WalletTopEntry[];
          currency_breakdown: CurrencyEntry[];
        };
        setTopWallets(data.top_wallets ?? []);
        setCurrencyBreakdown(data.currency_breakdown ?? []);
      }
      if (geoRes.ok) {
        const data = (await geoRes.json()) as {
          distribution: GeoEntry[];
        };
        setGeoData(data.distribution ?? []);
      }
    } catch (err) {
      console.error("[ecx-dashboard] Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // Pivot brand series for multi-line chart: [{date, BrandA: n, BrandB: m}]
  const brands = [...new Set(brandSeries.map((s) => s.brand))].slice(0, 8);
  const dateMap = new Map<string, Record<string, number>>();
  for (const entry of brandSeries) {
    const existing = dateMap.get(entry.date) ?? {};
    existing[entry.brand] = (existing[entry.brand] ?? 0) + entry.count;
    dateMap.set(entry.date, existing);
  }
  const lineData = [...dateMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  return (
    <div className="group relative space-y-6">
      <FeedbackButton
        feedbackId="ssi-ecx-dashboard.page"
        className="absolute top-1 right-0 z-10"
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">eCX Trend Dashboard</h1>
          <p className="text-sm text-slate-500">
            Community threat intelligence trends and patterns.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchAll()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Row 1: Phish by Brand + Currency Breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Phish by Brand — Time Series */}
        <Card className="col-span-2 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Phish Submissions by Brand (30 days)
          </h2>
          {lineData.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">
              No submission data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {brands.map((brand, i) => (
                  <Line
                    key={brand}
                    type="monotone"
                    dataKey={brand}
                    stroke={BRAND_COLORS[i % BRAND_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Currency Breakdown — Pie */}
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Wallet Currencies
          </h2>
          {currencyBreakdown.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">
              No wallet data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={currencyBreakdown}
                  dataKey="count"
                  nameKey="token_symbol"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {currencyBreakdown.map((_, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Row 2: Top Wallets + Geographic Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Wallets — Bar chart */}
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Most-Reported Wallet Addresses
          </h2>
          {topWallets.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">
              No wallet data available.
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={topWallets.slice(0, 10)}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="wallet_address"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(addr: string) =>
                      addr.length > 12
                        ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
                        : addr
                    }
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number, _name: string, props) => {
                      const entry = (props as { payload?: WalletTopEntry })
                        .payload;
                      return [
                        `${value} occurrences`,
                        `${entry?.token_symbol ?? ""} (${entry?.network_short ?? ""})`,
                      ];
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </Card>

        {/* Geographic Distribution — Bar chart */}
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            Infrastructure Geographic Distribution
          </h2>
          {geoData.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">
              No geographic data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={geoData.slice(0, 15)}>
                <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

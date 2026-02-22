"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Badge, Card, SectionLabel } from "@i4g/ui-kit";
import { ArrowUpRight, Search, Wallet } from "lucide-react";
import type { WalletRecord, WalletsSearchResponse } from "@/types/ssi";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function WalletsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [address, setAddress] = useState(searchParams.get("address") ?? "");
  const [tokenSymbol, setTokenSymbol] = useState(
    searchParams.get("token_symbol") ?? "",
  );
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchWallets = useCallback(async (addr?: string, token?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (addr) params.set("address", addr);
    if (token) params.set("token_symbol", token);
    const qs = params.toString();

    try {
      const res = await fetch(`/api/ssi/wallets${qs ? `?${qs}` : ""}`);
      if (res.ok) {
        const data = (await res.json()) as WalletsSearchResponse;
        setWallets(data.items);
      } else {
        setWallets([]);
      }
    } catch {
      setWallets([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  // Load initial results on mount (with params from URL)
  useEffect(() => {
    const addr = searchParams.get("address") ?? undefined;
    const token = searchParams.get("token_symbol") ?? undefined;
    void fetchWallets(addr, token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (address) params.set("address", address);
    if (tokenSymbol) params.set("token_symbol", tokenSymbol);
    router.push(`/ssi/wallets${params.size > 0 ? `?${params}` : ""}`);
    void fetchWallets(address || undefined, tokenSymbol || undefined);
  }

  return (
    <div className="space-y-8">
      <header>
        <SectionLabel>Scam Site Investigator</SectionLabel>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
          Wallet Search
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Search harvested cryptocurrency wallet addresses across all SSI
          investigations.
        </p>
      </header>

      {/* Search form */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Wallet Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x... or full address"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div className="w-full sm:w-40">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Token
          </label>
          <input
            type="text"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            placeholder="ETH, BTC, ..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </form>

      {/* Results */}
      {loading && (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
            />
          ))}
        </div>
      )}

      {!loading && searched && wallets.length === 0 && (
        <Card className="p-12 text-center">
          <Wallet className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No wallets found matching your search criteria.
          </p>
        </Card>
      )}

      {!loading && wallets.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-left text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Token</th>
                  <th className="px-4 py-3">Network</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Site</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {wallets.map((w: WalletRecord) => (
                  <tr
                    key={w.wallet_id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      {w.token_symbol}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {w.network_short}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300 break-all max-w-xs">
                      {w.wallet_address}
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{w.source ?? "—"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {w.confidence != null
                        ? `${(w.confidence * 100).toFixed(0)}%`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                      {w.site_url ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(w.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/ssi/investigations/${w.scan_id}`}
                        className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
                        title="View investigation"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Showing {wallets.length} result{wallets.length !== 1 ? "s" : ""}
          </div>
        </Card>
      )}
    </div>
  );
}

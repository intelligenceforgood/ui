"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Badge, Button } from "@i4g/ui-kit";
import { entityTypeLabel } from "@/lib/entity-types";
import { formatEntityValue } from "@/lib/entity-format";
import {
  Bell,
  BellOff,
  Eye,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface WatchlistItem {
  watchlistId: string;
  entityType: string;
  canonicalValue: string;
  alertOnNewCase: boolean;
  alertOnLossIncrease: boolean;
  lossThreshold: number | null;
  note: string | null;
  createdBy: string;
  createdAt: string | null;
}

interface WatchlistAlert {
  alertId: string;
  watchlistId: string;
  alertType: string;
  message: string;
  isRead: boolean;
  createdAt: string | null;
}

export default function WatchlistExplorer() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<WatchlistAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ limit: "100" });
      if (filter) query.set("entity_type", filter);
      const res = await fetch(`/api/intelligence/watchlist?${query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch(
        "/api/intelligence/watchlist/alerts?unread_only=true&limit=20",
      );
      if (res.ok) {
        setAlerts(await res.json());
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchAlerts();
  }, [fetchItems, fetchAlerts]);

  const handleRemove = useCallback(async (watchlistId: string) => {
    const res = await fetch(`/api/intelligence/watchlist/${watchlistId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.watchlistId !== watchlistId));
    }
  }, []);

  const handleToggleAlert = useCallback(
    async (
      item: WatchlistItem,
      field: "alertOnNewCase" | "alertOnLossIncrease",
    ) => {
      const update = { [field]: !item[field] };
      const res = await fetch(
        `/api/intelligence/watchlist/${item.watchlistId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(update),
        },
      );
      if (res.ok) {
        const updated = await res.json();
        setItems((prev) =>
          prev.map((i) =>
            i.watchlistId === item.watchlistId ? { ...i, ...updated } : i,
          ),
        );
      }
    },
    [],
  );

  const handleMarkAllRead = useCallback(async () => {
    const res = await fetch("/api/intelligence/watchlist/alerts/read-all", {
      method: "POST",
    });
    if (res.ok) {
      setAlerts([]);
    }
  }, []);

  const entityTypes = [...new Set(items.map((i) => i.entityType))].sort();

  return (
    <div className="space-y-6">
      {/* Unread alerts */}
      {alerts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Unread Alerts
              </h2>
              <Badge variant="warning">{alerts.length}</Badge>
            </div>
            <Button size="sm" variant="secondary" onClick={handleMarkAllRead}>
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Mark All Read
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.map((alert) => (
              <Card
                key={alert.alertId}
                className="border-amber-100 p-3 dark:border-amber-900/30"
              >
                <div className="flex items-start justify-between">
                  <Badge
                    variant={
                      alert.alertType === "new_case" ? "warning" : "danger"
                    }
                  >
                    {alert.alertType === "new_case"
                      ? "New Case"
                      : "Loss Increase"}
                  </Badge>
                  <span className="text-[10px] text-slate-400">
                    {alert.createdAt
                      ? new Date(alert.createdAt).toLocaleDateString()
                      : ""}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {alert.message}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">All Types</option>
          {entityTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Button size="sm" variant="secondary" onClick={fetchItems}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Refresh
        </Button>
        <span className="text-sm text-slate-400">
          {items.length} watched {items.length === 1 ? "entity" : "entities"}
        </span>
      </div>

      {/* Loading / Error / Empty */}
      {loading && (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
        </div>
      )}
      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}
      {!loading && !error && items.length === 0 && (
        <Card className="flex h-32 items-center justify-center text-sm text-slate-400">
          No entities on your watchlist. Pin entities from the Entity Explorer
          to start monitoring.
        </Card>
      )}

      {/* Watchlist items */}
      {!loading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <Card
              key={item.watchlistId}
              className="flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" title={item.entityType}>
                      {entityTypeLabel(item.entityType)}
                    </Badge>
                    <span
                      className="font-mono text-sm font-medium text-slate-900 dark:text-white"
                      title={item.canonicalValue}
                    >
                      {formatEntityValue(item.entityType, item.canonicalValue)}
                    </span>
                  </div>
                  {item.note && (
                    <p className="mt-0.5 text-xs text-slate-400">{item.note}</p>
                  )}
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Watched since{" "}
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAlert(item, "alertOnNewCase")}
                  className={`rounded-md px-2 py-1 text-xs transition-colors ${
                    item.alertOnNewCase
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                  }`}
                  title="Toggle new case alerts"
                >
                  {item.alertOnNewCase ? (
                    <Bell className="h-3.5 w-3.5" />
                  ) : (
                    <BellOff className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAlert(item, "alertOnLossIncrease")}
                  className={`rounded-md px-2 py-1 text-xs transition-colors ${
                    item.alertOnLossIncrease
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                  }`}
                  title="Toggle loss increase alerts"
                >
                  $
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(item.watchlistId)}
                  className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  title="Remove from watchlist"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

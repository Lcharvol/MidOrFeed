"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SeedCard } from "./SeedCard";
import { ProcessCard } from "./ProcessCard";
import { SyncAccountsCard } from "./SyncAccountsCard";
import { PipelineCard } from "./PipelineCard";
import { StatusBreakdownCard } from "./StatusBreakdownCard";
import { StatCard } from "../StatCard";
import {
  UsersIcon,
  DatabaseIcon,
  RefreshCwIcon,
  TrendingUpIcon,
} from "lucide-react";
import { authenticatedFetch } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n-context";

type Stats = {
  totalPlayers: number;
  totalMatches: number;
  totalAccounts: number;
  byStatus: Record<string, number>;
  loading: boolean;
};

export const DiscoverTab = () => {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats>({
    totalPlayers: 0,
    totalMatches: 0,
    totalAccounts: 0,
    byStatus: {},
    loading: true,
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchStats = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) {
        setStats((prev) => ({ ...prev, loading: true }));
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const response = await authenticatedFetch("/api/admin/stats", {
        signal: controller.signal,
        cache: "no-store",
      });
      const result = await response.json();
      if (response.ok) {
        setStats({
          totalPlayers: result.totalPlayers || 0,
          totalMatches: result.totalMatches || 0,
          totalAccounts: result.totalAccounts || 0,
          byStatus: result.byStatus || {},
          loading: false,
        });
        hasLoadedRef.current = true;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStats((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    // Defer to avoid synchronous setState during render
    const id = setTimeout(() => {
      fetchStats();
    }, 0);
    return () => {
      clearTimeout(id);
      const ctrl = abortControllerRef.current;
      if (ctrl) ctrl.abort();
    };
  }, [fetchStats]);

  useEffect(() => {
    const pending = stats.byStatus.pending || 0;
    const crawling = stats.byStatus.crawling || 0;
    const shouldPoll = pending > 0 || crawling > 0;
    if (!shouldPoll) return;
    const interval = setInterval(() => {
      fetchStats();
    }, 3000);
    return () => clearInterval(interval);
  }, [stats.byStatus.pending, stats.byStatus.crawling, fetchStats]);

  const pending = stats.byStatus.pending || 0;
  const crawling = stats.byStatus.crawling || 0;
  const completed = stats.byStatus.completed || 0;
  const failed = stats.byStatus.failed || 0;

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard
          title={t("admin.discover.totalPlayers")}
          value={stats.totalPlayers}
          description={t("admin.discover.totalPlayersDesc")}
          icon={<UsersIcon className="size-4 text-primary" />}
          loading={stats.loading}
          variant="default"
        />
        <StatCard
          title={t("admin.discover.totalMatches")}
          value={stats.totalMatches}
          description={t("admin.discover.totalMatchesDesc")}
          icon={<DatabaseIcon className="size-4 text-primary" />}
          loading={stats.loading}
          variant="default"
        />
        <StatCard
          title={t("admin.discover.lolAccounts")}
          value={stats.totalAccounts}
          description={t("admin.discover.lolAccountsDesc")}
          icon={<UsersIcon className="size-4 text-primary" />}
          loading={stats.loading}
          variant="default"
        />
        <StatCard
          title={t("admin.discover.pending")}
          value={pending}
          description={t("admin.discover.pendingDesc")}
          icon={
            <RefreshCwIcon className="size-4 text-amber-600 dark:text-amber-500" />
          }
          loading={stats.loading}
          variant="amber"
        />
        <StatCard
          title={t("admin.discover.completed")}
          value={completed}
          description={t("admin.discover.completedDesc")}
          icon={
            <TrendingUpIcon className="size-4 text-green-600 dark:text-green-500" />
          }
          loading={stats.loading}
          variant="green"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SeedCard onSeedComplete={fetchStats} />
        <ProcessCard
          pendingCount={pending}
          crawlingCount={crawling}
          completedCount={completed}
          failedCount={failed}
          onProcessComplete={fetchStats}
        />
        <SyncAccountsCard onSyncComplete={fetchStats} />
        <PipelineCard />
      </div>
      <StatusBreakdownCard byStatus={stats.byStatus} loading={stats.loading} />
    </div>
  );
};

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  UsersIcon,
  DatabaseIcon,
  RefreshCwIcon,
  TrendingUpIcon,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { SeedCard } from "./SeedCard";
import { ProcessCard } from "./ProcessCard";
import { SyncAccountsCard } from "./SyncAccountsCard";
import { StatusBreakdownCard } from "./StatusBreakdownCard";
import { PipelineCard } from "./PipelineCard";

interface Stats {
  totalPlayers: number;
  totalMatches: number;
  totalAccounts: number;
  byStatus: Record<string, number>;
  loading: boolean;
}

export default function AdminPage() {
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
      // éviter les sursauts: ne bascule en loading que pour le premier chargement
      if (!hasLoadedRef.current) {
        setStats((prev) => ({ ...prev, loading: true }));
      }

      // Cancel any in-flight request before starting a new one
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch("/api/admin/stats", {
        signal: controller.signal,
        cache: "no-store",
      });
      const result = await response.json();

      if (response.ok) {
        const next = {
          totalPlayers: result.totalPlayers || 0,
          totalMatches: result.totalMatches || 0,
          totalAccounts: result.totalAccounts || 0,
          byStatus: result.byStatus || {},
          loading: false,
        } as Stats;
        // skip update si pas de changement pour éviter les rerenders visibles
        setStats((prev) => {
          if (!prev) return next;
          const same =
            prev.totalPlayers === next.totalPlayers &&
            prev.totalMatches === next.totalMatches &&
            prev.totalAccounts === next.totalAccounts &&
            JSON.stringify(prev.byStatus) === JSON.stringify(next.byStatus);
          return same ? prev : next;
        });
        hasLoadedRef.current = true;
      }
    } catch (error) {
      // Ignore abort errors (common under React Strict Mode double-invoke in dev)
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error("Erreur lors de la récupération des stats:", error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  // Charger les stats au mount
  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll des stats uniquement lorsqu'il y a de l'activité (pending/crawling)
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

  // Nettoyage: annuler toute requête en cours au démontage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="container mx-auto py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Panel d&apos;Administration</h1>
        <p className="text-muted-foreground">
          Gestion du système de crawl de données League of Legends
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard
          title="Total Joueurs"
          value={stats.totalPlayers}
          description="Joueurs découverts"
          icon={<UsersIcon className="size-4 text-primary" />}
          loading={stats.loading}
          variant="default"
        />

        <StatCard
          title="Total Matchs"
          value={stats.totalMatches}
          description="Matchs collectés"
          icon={<DatabaseIcon className="size-4 text-primary" />}
          loading={stats.loading}
          variant="default"
        />

        <StatCard
          title="Comptes LOL"
          value={stats.totalAccounts}
          description="Comptes créés"
          icon={<UsersIcon className="size-4 text-primary" />}
          loading={stats.loading}
          variant="default"
        />

        <StatCard
          title="En Attente"
          value={stats.byStatus.pending || 0}
          description="Joueurs pending"
          icon={
            <RefreshCwIcon className="size-4 text-amber-600 dark:text-amber-500" />
          }
          loading={stats.loading}
          variant="amber"
        />

        <StatCard
          title="Complétés"
          value={stats.byStatus.completed || 0}
          description="Crawl terminés"
          icon={
            <TrendingUpIcon className="size-4 text-green-600 dark:text-green-500" />
          }
          loading={stats.loading}
          variant="green"
        />
      </div>

      {/* Commandes de crawl */}
      <div className="grid gap-6 md:grid-cols-2">
        <SeedCard onSeedComplete={fetchStats} />

        <ProcessCard
          pendingCount={stats.byStatus.pending || 0}
          crawlingCount={stats.byStatus.crawling || 0}
          completedCount={stats.byStatus.completed || 0}
          failedCount={stats.byStatus.failed || 0}
          onProcessComplete={fetchStats}
        />

        <SyncAccountsCard onSyncComplete={fetchStats} />
        <PipelineCard />
      </div>

      {/* Détails par statut */}
      <StatusBreakdownCard byStatus={stats.byStatus} loading={stats.loading} />
    </div>
  );
}

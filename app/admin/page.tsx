"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2Icon,
  PlayIcon,
  TrendingUpIcon,
  UsersIcon,
  DatabaseIcon,
  RefreshCwIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n-context";
import { RIOT_REGIONS } from "@/lib/riot-regions";

export default function AdminPage() {
  const { t } = useI18n();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [processController, setProcessController] =
    useState<AbortController | null>(null);
  const [processProgress, setProcessProgress] = useState({
    current: 0,
    total: 0,
  });
  const [seedRegion, setSeedRegion] = useState("euw1");
  const [seedCount, setSeedCount] = useState("50");
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalMatches: 0,
    totalAccounts: 0,
    byStatus: {} as Record<string, number>,
    loading: true,
  });

  const fetchStats = async () => {
    try {
      setStats((prev) => ({ ...prev, loading: true }));

      const response = await fetch("/api/admin/stats");
      const result = await response.json();

      if (response.ok) {
        setStats({
          totalPlayers: result.totalPlayers || 0,
          totalMatches: result.totalMatches || 0,
          totalAccounts: result.totalAccounts || 0,
          byStatus: result.byStatus || {},
          loading: false,
        });
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des stats:", error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  // Charger les stats au mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Poll des stats pour mettre à jour la progression
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        fetchStats();
      }, 2000); // Toutes les 2 secondes

      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch("/api/crawl/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: seedRegion,
          count: parseInt(seedCount),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          `${result.data.newPlayersAdded} nouveaux joueurs découverts`
        );
        fetchStats(); // Rafraîchir les stats
      } else {
        toast.error(result.error || "Erreur lors du seed");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleProcess = async () => {
    const controller = new AbortController();
    setProcessController(controller);
    setIsProcessing(true);

    try {
      const response = await fetch("/api/crawl/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`${result.data.matchesCollected} matchs collectés`);
        fetchStats(); // Rafraîchir les stats
      } else {
        toast.error(result.error || "Erreur lors du traitement");
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        toast.info("Traitement annulé");
      } else {
        console.error("Erreur:", error);
        toast.error("Une erreur est survenue");
      }
    } finally {
      setIsProcessing(false);
      setProcessController(null);
    }
  };

  const handleCancelProcess = async () => {
    if (processController) {
      setIsCancelling(true);
      processController.abort();
      setProcessController(null);
      setIsCancelling(false);
      setIsProcessing(false);
      toast.info("Arrêt du traitement en cours...");
    }
  };

  const handleSyncAccounts = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/admin/sync-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`${result.data.accountsCreated} comptes synchronisés`);
        fetchStats(); // Rafraîchir les stats
      } else {
        toast.error(result.error || "Erreur lors de la synchronisation");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Panel d&apos;Administration</h1>
        <p className="text-muted-foreground">
          Gestion du système de crawl de données League of Legends
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Joueurs</CardTitle>
            <UsersIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.loading ? (
                <Loader2Icon className="size-6 animate-spin" />
              ) : (
                stats.totalPlayers.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">Joueurs découverts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matchs</CardTitle>
            <DatabaseIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.loading ? (
                <Loader2Icon className="size-6 animate-spin" />
              ) : (
                stats.totalMatches.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">Matchs collectés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comptes LOL</CardTitle>
            <UsersIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.loading ? (
                <Loader2Icon className="size-6 animate-spin" />
              ) : (
                stats.totalAccounts.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">Comptes créés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <RefreshCwIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.loading ? (
                <Loader2Icon className="size-6 animate-spin" />
              ) : (
                stats.byStatus.pending?.toLocaleString() || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Joueurs pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complétés</CardTitle>
            <TrendingUpIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.loading ? (
                <Loader2Icon className="size-6 animate-spin" />
              ) : (
                stats.byStatus.completed?.toLocaleString() || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Crawl terminés</p>
          </CardContent>
        </Card>
      </div>

      {/* Commandes de crawl */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Seed */}
        <Card>
          <CardHeader>
            <CardTitle>Découverte de joueurs</CardTitle>
            <CardDescription>
              Découvrir de nouveaux joueurs depuis les matchs existants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="region">Région</Label>
              <Select value={seedRegion} onValueChange={setSeedRegion}>
                <SelectTrigger id="region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RIOT_REGIONS.map((region) => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="count">Nombre de joueurs</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="100"
                value={seedCount}
                onChange={(e) => setSeedCount(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSeed}
              disabled={isSeeding}
              className="w-full"
            >
              {isSeeding ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Découverte en cours...
                </>
              ) : (
                <>
                  <PlayIcon className="mr-2 size-4" />
                  Démarrer la découverte
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Process */}
        <Card>
          <CardHeader>
            <CardTitle>Traitement des joueurs</CardTitle>
            <CardDescription>
              Crawler tous les joueurs en attente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Joueurs en attente: {stats.byStatus.pending || 0}
              </Badge>
              {stats.byStatus.crawling && stats.byStatus.crawling > 0 && (
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  En cours: {stats.byStatus.crawling}
                </Badge>
              )}
            </div>

            {/* Barre de progression */}
            {isProcessing &&
              (stats.byStatus.pending || 0) + (stats.byStatus.crawling || 0) >
                0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium">
                      {Math.round(
                        ((stats.byStatus.completed || 0) /
                          ((stats.byStatus.completed || 0) +
                            (stats.byStatus.pending || 0) +
                            (stats.byStatus.crawling || 0))) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      ((stats.byStatus.completed || 0) /
                        ((stats.byStatus.completed || 0) +
                          (stats.byStatus.pending || 0) +
                          (stats.byStatus.crawling || 0))) *
                      100
                    }
                  />
                </div>
              )}

            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                Cette commande traite TOUS les joueurs en attente et collecte
                jusqu&apos;à 100 matchs par joueur.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleProcess}
                disabled={isProcessing || (stats.byStatus.pending || 0) === 0}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <PlayIcon className="mr-2 size-4" />
                    Démarrer le traitement
                  </>
                )}
              </Button>

              {isProcessing && (
                <Button
                  onClick={handleCancelProcess}
                  disabled={isCancelling}
                  variant="destructive"
                >
                  {isCancelling ? (
                    <>
                      <Loader2Icon className="mr-2 size-4 animate-spin" />
                      Arrêt...
                    </>
                  ) : (
                    <>Arrêter</>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sync Accounts */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Synchronisation des comptes</CardTitle>
            <CardDescription>
              Convertir les participants de matchs en comptes League of Legends
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                Cette commande analyse tous les participants de matchs et crée
                des comptes League of Legends avec leurs statistiques calculées.
              </p>
            </div>

            <Button
              onClick={handleSyncAccounts}
              disabled={isSyncing}
              className="w-full"
            >
              {isSyncing ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Synchronisation en cours...
                </>
              ) : (
                <>
                  <DatabaseIcon className="mr-2 size-4" />
                  Synchroniser les comptes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Détails par statut */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par statut</CardTitle>
          <CardDescription>
            État actuel de tous les joueurs découverts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {stats.loading ? (
              <div className="col-span-4 flex items-center justify-center py-8">
                <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="text-sm font-medium capitalize">{status}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
                {Object.keys(stats.byStatus).length === 0 && (
                  <div className="col-span-4 text-center py-8 text-muted-foreground">
                    Aucun joueur découvert pour le moment
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bouton de rafraîchissement */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={fetchStats} disabled={stats.loading}>
          {stats.loading ? (
            <>
              <Loader2Icon className="mr-2 size-4 animate-spin" />
              Chargement...
            </>
          ) : (
            <>
              <RefreshCwIcon className="mr-2 size-4" />
              Rafraîchir les statistiques
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

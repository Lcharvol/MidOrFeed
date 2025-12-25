"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Loader2Icon,
  DatabaseIcon,
  CheckCircle2Icon,
  UsersIcon,
  TrendingUpIcon,
  PlayIcon,
  StopCircleIcon,
  AlertCircleIcon,
  ZapIcon,
  WifiIcon,
  WifiOffIcon,
  ClockIcon,
} from "lucide-react";
import { toast } from "sonner";
import { authenticatedFetch } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n-context";

interface SyncAccountsState {
  isRunning: boolean;
  startedAt: string | null;
  totalAccounts: number;
  processedAccounts: number;
  accountsCreated: number;
  accountsUpdated: number;
  accountsSkipped: number;
  riotApiCalls: number;
  riotApiErrors: number;
  rateLimitHits: number;
  currentAccount: {
    puuid: string;
    region: string;
    gameName?: string | null;
  } | null;
  lastError: string | null;
  estimatedTimeRemaining: number | null;
  avgTimePerAccount: number;
}

interface SyncAccountsCardProps {
  onSyncComplete: () => void;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export function SyncAccountsCard({ onSyncComplete }: SyncAccountsCardProps) {
  const { t } = useI18n();
  const [syncState, setSyncState] = useState<SyncAccountsState | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [maxRiotCalls, setMaxRiotCalls] = useState(50);
  const [skipRiotApi, setSkipRiotApi] = useState(false);

  // Récupérer l'état du processus
  const fetchStatus = useCallback(async () => {
    try {
      const response = await authenticatedFetch("/api/admin/sync-accounts");
      if (response.ok) {
        const result = await response.json();
        setSyncState(result.data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du statut:", error);
    }
  }, []);

  // Polling pour l'état du processus
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Notifier quand le processus est terminé
  useEffect(() => {
    if (syncState && !syncState.isRunning && syncState.processedAccounts > 0) {
      onSyncComplete();
    }
  }, [syncState?.isRunning, syncState?.processedAccounts, onSyncComplete]);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const response = await authenticatedFetch("/api/admin/sync-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxRiotCallsPerCycle: maxRiotCalls,
          skipRiotApi,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Démarrage de la synchronisation de ${result.data.totalAccounts} comptes`);
      } else if (response.status === 409) {
        toast.info("Une synchronisation est déjà en cours");
      } else {
        toast.error(result.error || "Erreur lors du démarrage");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du démarrage de la synchronisation");
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      const response = await authenticatedFetch("/api/admin/sync-accounts", {
        method: "DELETE",
      });

      if (response.ok) {
        toast.info("Synchronisation arrêtée");
        onSyncComplete();
      } else {
        toast.error("Erreur lors de l'arrêt");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'arrêt");
    } finally {
      setIsStopping(false);
    }
  };

  const isRunning = syncState?.isRunning ?? false;
  const progressPercent = syncState
    ? syncState.totalAccounts > 0
      ? (syncState.processedAccounts / syncState.totalAccounts) * 100
      : 0
    : 0;

  return (
    <Card variant="gradient" className="md:col-span-2">
      <CardHeader withGlow>
        <CardTitle className="flex items-center gap-2">
          <DatabaseIcon className="size-5 text-blue-500" />
          {t("admin.discover.syncAccountsCard.title")}
        </CardTitle>
        <CardDescription>
          {t("admin.discover.syncAccountsCard.description")}
        </CardDescription>
        <CardAction>
          <div className="flex gap-2">
            {!isRunning ? (
              <Button
                onClick={handleStart}
                disabled={isStarting}
                className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                size="sm"
              >
                {isStarting ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Démarrage...
                  </>
                ) : (
                  <>
                    <PlayIcon className="mr-2 size-4" />
                    {t("admin.discover.syncAccountsCard.sync")}
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleStop}
                disabled={isStopping}
                variant="destructive"
                size="sm"
              >
                {isStopping ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Arrêt...
                  </>
                ) : (
                  <>
                    <StopCircleIcon className="mr-2 size-4" />
                    Arrêter
                  </>
                )}
              </Button>
            )}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress section when running */}
        {isRunning && syncState && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            {/* Current account */}
            {syncState.currentAccount && (
              <div className="flex items-center gap-2 text-sm">
                <UsersIcon className="size-4 text-blue-500" />
                <span className="text-muted-foreground">En cours:</span>
                <span className="font-mono text-xs">
                  {syncState.currentAccount.puuid.slice(0, 12)}...
                </span>
                <Badge variant="outline" className="text-xs">
                  {syncState.currentAccount.region.toUpperCase()}
                </Badge>
              </div>
            )}

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {syncState.processedAccounts} / {syncState.totalAccounts} comptes
                </span>
                <span className="font-medium">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:grid-cols-6">
              <div className="flex flex-col rounded-md bg-background/50 p-2">
                <span className="text-xs text-muted-foreground">Créés</span>
                <span className="font-semibold text-green-600">
                  {syncState.accountsCreated}
                </span>
              </div>
              <div className="flex flex-col rounded-md bg-background/50 p-2">
                <span className="text-xs text-muted-foreground">Ignorés</span>
                <span className="font-semibold text-amber-600">
                  {syncState.accountsSkipped}
                </span>
              </div>
              <div className="flex flex-col rounded-md bg-background/50 p-2">
                <span className="text-xs text-muted-foreground">API Riot</span>
                <span className="font-semibold text-blue-600">
                  {syncState.riotApiCalls}
                </span>
              </div>
              <div className="flex flex-col rounded-md bg-background/50 p-2">
                <span className="text-xs text-muted-foreground">Erreurs API</span>
                <span className="font-semibold text-red-600">
                  {syncState.riotApiErrors}
                </span>
              </div>
              <div className="flex flex-col rounded-md bg-background/50 p-2">
                <span className="text-xs text-muted-foreground">Rate Limits</span>
                <span className="font-semibold text-orange-600">
                  {syncState.rateLimitHits}
                </span>
              </div>
              <div className="flex flex-col rounded-md bg-background/50 p-2">
                <span className="text-xs text-muted-foreground">Temps restant</span>
                <span className="font-semibold">
                  {formatDuration(syncState.estimatedTimeRemaining)}
                </span>
              </div>
            </div>

            {/* Last error */}
            {syncState.lastError && (
              <div className="flex items-start gap-2 rounded-md bg-red-500/10 p-2 text-sm text-red-600">
                <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
                <span>{syncState.lastError}</span>
              </div>
            )}
          </div>
        )}

        {/* Completed results */}
        {!isRunning && syncState && syncState.processedAccounts > 0 && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CheckCircle2Icon className="size-4 text-green-500" />
              {t("admin.discover.syncAccountsCard.syncCompleted")}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1 rounded-md bg-background/50 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <UsersIcon className="size-3" />
                  Total traités
                </div>
                <div className="text-lg font-bold text-foreground">
                  {syncState.processedAccounts.toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-md bg-background/50 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2Icon className="size-3 text-green-500" />
                  {t("admin.discover.syncAccountsCard.accountsCreated")}
                </div>
                <div className="text-lg font-bold text-green-600">
                  {syncState.accountsCreated.toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col gap-1 rounded-md bg-background/50 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ZapIcon className="size-3 text-blue-500" />
                  Appels API Riot
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {syncState.riotApiCalls.toLocaleString()}
                </div>
              </div>
            </div>
            {syncState.processedAccounts > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline">
                  Taux de réussite:{" "}
                  {(
                    (syncState.accountsCreated / syncState.processedAccounts) *
                    100
                  ).toFixed(1)}
                  %
                </Badge>
                {syncState.rateLimitHits > 0 && (
                  <Badge variant="warning">
                    {syncState.rateLimitHits} rate limits
                  </Badge>
                )}
                {syncState.riotApiErrors > 0 && (
                  <Badge variant="destructive">
                    {syncState.riotApiErrors} erreurs API
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Configuration (when not running) */}
        {!isRunning && (
          <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground">
              {t("admin.discover.syncAccountsCard.whatItDoes")}
            </p>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {skipRiotApi ? (
                    <WifiOffIcon className="size-4 text-muted-foreground" />
                  ) : (
                    <WifiIcon className="size-4 text-blue-500" />
                  )}
                  <span className="text-sm">Appels API Riot</span>
                </div>
                <Switch
                  checked={!skipRiotApi}
                  onCheckedChange={(checked) => setSkipRiotApi(!checked)}
                />
              </div>

              {!skipRiotApi && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <ClockIcon className="size-3" />
                      Limite d'appels API
                    </span>
                    <span className="font-medium">{maxRiotCalls} appels max</span>
                  </div>
                  <Slider
                    value={[maxRiotCalls]}
                    onValueChange={([value]) => setMaxRiotCalls(value)}
                    min={0}
                    max={200}
                    step={10}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {t("admin.discover.syncAccountsCard.commandDescription")}
            </p>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                <DatabaseIcon className="mr-1 size-3" />
                {t("admin.discover.syncAccountsCard.createsAccounts")}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <TrendingUpIcon className="mr-1 size-3" />
                {t("admin.discover.syncAccountsCard.updatesStats")}
              </Badge>
              {!skipRiotApi && (
                <Badge variant="secondary" className="text-xs">
                  <UsersIcon className="mr-1 size-3" />
                  {t("admin.discover.syncAccountsCard.fetchRiotData")}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

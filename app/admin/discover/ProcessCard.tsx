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
import { Slider } from "@/components/ui/slider";
import {
  Loader2Icon,
  PlayIcon,
  StopCircleIcon,
  RefreshCwIcon,
  ClockIcon,
  UserIcon,
  ZapIcon,
  AlertCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n-context";
import { MATCHES_FETCH_LIMIT } from "@/constants/matches";

interface CrawlProcessState {
  isRunning: boolean;
  startedAt: string | null;
  totalPlayers: number;
  processedPlayers: number;
  successfulPlayers: number;
  failedPlayers: number;
  totalMatchesCollected: number;
  currentPlayer: {
    puuid: string;
    region: string;
    gameName?: string | null;
  } | null;
  lastError: string | null;
  estimatedTimeRemaining: number | null;
  avgTimePerPlayer: number;
  queueStatus: {
    pending: number;
    crawling: number;
    completed: number;
    failed: number;
  };
}

interface ProcessCardProps {
  pendingCount: number;
  crawlingCount: number;
  completedCount: number;
  failedCount?: number;
  onProcessComplete: () => void;
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

export function ProcessCard({
  pendingCount: initialPendingCount,
  crawlingCount: initialCrawlingCount,
  completedCount: initialCompletedCount,
  failedCount: initialFailedCount = 0,
  onProcessComplete,
}: ProcessCardProps) {
  const { t } = useI18n();
  const [processState, setProcessState] = useState<CrawlProcessState | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isRetryingFailed, setIsRetryingFailed] = useState(false);
  const [batchSize, setBatchSize] = useState(10);
  const [delayMs, setDelayMs] = useState(500);

  // Récupérer l'état du processus
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/crawl/process");
      if (response.ok) {
        const result = await response.json();
        setProcessState(result.data);
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
    if (processState && !processState.isRunning && processState.processedPlayers > 0) {
      onProcessComplete();
    }
  }, [processState?.isRunning, processState?.processedPlayers, onProcessComplete]);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const response = await fetch("/api/crawl/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchSize,
          delayBetweenPlayers: delayMs,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Démarrage du crawl de ${result.data.totalPlayers} joueurs`);
      } else if (response.status === 409) {
        toast.info("Un processus est déjà en cours");
      } else {
        toast.error(result.error || "Erreur lors du démarrage");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du démarrage du crawl");
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      const response = await fetch("/api/crawl/process", {
        method: "DELETE",
      });

      if (response.ok) {
        toast.info("Processus arrêté");
        onProcessComplete();
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

  const handleRetryFailed = async () => {
    setIsRetryingFailed(true);
    try {
      const response = await fetch("/api/crawl/retry-failed", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || t("admin.discover.processCard.failedPlayersReset"));
        onProcessComplete();
      } else {
        toast.error(data.error || t("admin.discover.processCard.errorReset"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("admin.discover.processCard.errorOccurred"));
    } finally {
      setIsRetryingFailed(false);
    }
  };

  const isRunning = processState?.isRunning ?? false;
  const pendingCount = processState?.queueStatus?.pending ?? initialPendingCount;
  const crawlingCount = processState?.queueStatus?.crawling ?? initialCrawlingCount;
  const completedCount = processState?.queueStatus?.completed ?? initialCompletedCount;
  const failedCount = processState?.queueStatus?.failed ?? initialFailedCount;

  const progressPercent = processState
    ? processState.totalPlayers > 0
      ? (processState.processedPlayers / processState.totalPlayers) * 100
      : 0
    : 0;

  return (
    <Card variant="gradient">
      <CardHeader withGlow>
        <CardTitle className="flex items-center gap-2">
          <ZapIcon className="size-5" />
          {t("admin.discover.processCard.title")}
        </CardTitle>
        <CardDescription>{t("admin.discover.processCard.description")}</CardDescription>
        <CardAction>
          <div className="flex gap-2">
            {!isRunning ? (
              <Button
                onClick={handleStart}
                disabled={isStarting || pendingCount === 0}
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
                    {t("admin.discover.processCard.start")}
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
                    {t("admin.discover.processCard.stop")}
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={handleRetryFailed}
              disabled={isRunning || isRetryingFailed || failedCount === 0}
              variant="outline"
              size="sm"
            >
              {isRetryingFailed ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Relance...
                </>
              ) : (
                <>
                  <RefreshCwIcon className="mr-2 size-4" />
                  {t("admin.discover.processCard.restartFailed")}
                </>
              )}
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="warning" className="gap-1">
            <ClockIcon className="size-3" />
            En attente: {pendingCount}
          </Badge>
          {crawlingCount > 0 && (
            <Badge variant="info" className="gap-1 animate-pulse">
              <Loader2Icon className="size-3 animate-spin" />
              En cours: {crawlingCount}
            </Badge>
          )}
          <Badge variant="success" className="gap-1">
            Terminés: {completedCount}
          </Badge>
          {failedCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircleIcon className="size-3" />
              Échoués: {failedCount}
            </Badge>
          )}
        </div>

        {/* Progress section when running */}
        {isRunning && processState && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            {/* Current player */}
            {processState.currentPlayer && (
              <div className="flex items-center gap-2 text-sm">
                <UserIcon className="size-4 text-blue-500" />
                <span className="text-muted-foreground">En cours:</span>
                <span className="font-medium">
                  {processState.currentPlayer.gameName ||
                   processState.currentPlayer.puuid.slice(0, 12) + "..."}
                </span>
                <Badge variant="outline" className="text-xs">
                  {processState.currentPlayer.region.toUpperCase()}
                </Badge>
              </div>
            )}

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {processState.processedPlayers} / {processState.totalPlayers} joueurs
                </span>
                <span className="font-medium">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Réussis</span>
                <span className="font-semibold text-green-600">
                  {processState.successfulPlayers}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Échoués</span>
                <span className="font-semibold text-red-600">
                  {processState.failedPlayers}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Matches</span>
                <span className="font-semibold text-blue-600">
                  {processState.totalMatchesCollected}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Temps restant</span>
                <span className="font-semibold">
                  {formatDuration(processState.estimatedTimeRemaining)}
                </span>
              </div>
            </div>

            {/* Last error */}
            {processState.lastError && (
              <div className="flex items-start gap-2 rounded-md bg-red-500/10 p-2 text-sm text-red-600">
                <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
                <span>{processState.lastError}</span>
              </div>
            )}
          </div>
        )}

        {/* Configuration (when not running) */}
        {!isRunning && (
          <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taille du lot</span>
                <span className="font-medium">{batchSize} joueurs</span>
              </div>
              <Slider
                value={[batchSize]}
                onValueChange={([value]) => setBatchSize(value)}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Délai entre joueurs</span>
                <span className="font-medium">{delayMs}ms</span>
              </div>
              <Slider
                value={[delayMs]}
                onValueChange={([value]) => setDelayMs(value)}
                min={100}
                max={2000}
                step={100}
                className="w-full"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("admin.discover.processCard.commandDescription").replace(
                "{limit}",
                MATCHES_FETCH_LIMIT.toString()
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCwIcon,
  PlayIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  LoaderIcon,
  AlertCircleIcon,
  ServerIcon,
  StopCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ActivityIcon,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface JobProgress {
  current: number;
  total: number;
  message?: string;
  percent?: number;
}

interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface Job {
  id: string;
  queue: string;
  name: string;
  status: string;
  progress: number | JobProgress;
  timestamp: number;
  duration?: number;
  failedReason?: string;
  processedOn?: number;
  finishedOn?: number;
}

interface ActiveJobDetails {
  id: string;
  name: string;
  queue: string;
  progress: JobProgress;
  state: string;
  timestamp: number;
  processedOn?: number;
}

interface JobsData {
  redisConnected: boolean;
  queues: Record<string, QueueStatus>;
  recentJobs: Job[];
  timestamp: number;
}

const QUEUE_INFO: Record<string, { label: string; description: string; icon: string }> = {
  "champion-stats": {
    label: "Stats Champions",
    description: "Calcul des winrates, KDA, counters par champion",
    icon: "📊",
  },
  "composition-gen": {
    label: "Compositions",
    description: "Génération des suggestions de compositions",
    icon: "🎮",
  },
  "data-crawl": {
    label: "Crawl Données",
    description: "Découverte de joueurs et collecte de matchs",
    icon: "🔍",
  },
  "account-sync": {
    label: "Sync Comptes",
    description: "Synchronisation des comptes via Riot API",
    icon: "🔄",
  },
};

export function JobsTab() {
  const [data, setData] = useState<JobsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggeringQueue, setTriggeringQueue] = useState<string | null>(null);
  const [cancellingJob, setCancellingJob] = useState<string | null>(null);
  const [activeJobsDetails, setActiveJobsDetails] = useState<Record<string, ActiveJobDetails>>({});
  const [expandedQueues, setExpandedQueues] = useState<Set<string>>(new Set());

  // Check if there are any active jobs
  const hasActiveJobs = data?.queues
    ? Object.values(data.queues).some((q) => q.active > 0)
    : false;

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/jobs");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch jobs");
      }
      setData(json);
      setError(null);

      // Fetch details for active jobs
      if (json.queues) {
        const activeQueues = Object.entries(json.queues)
          .filter(([, status]) => (status as QueueStatus).active > 0)
          .map(([name]) => name);

        for (const queueName of activeQueues) {
          fetchActiveJobDetails(queueName);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveJobDetails = async (queueName: string) => {
    try {
      const res = await fetch(`/api/admin/jobs/${queueName}`);
      const json = await res.json();
      if (res.ok && json.jobs) {
        const activeJobs = json.jobs.filter(
          (j: { state: string }) => j.state === "active"
        );
        for (const job of activeJobs) {
          setActiveJobsDetails((prev) => ({
            ...prev,
            [`${queueName}-${job.id}`]: {
              id: job.id,
              name: job.name,
              queue: queueName,
              progress: normalizeProgress(job.progress),
              state: job.state,
              timestamp: job.timestamp,
              processedOn: job.processedOn,
            },
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch active job details:", err);
    }
  };

  const normalizeProgress = (progress: number | JobProgress | undefined): JobProgress => {
    if (!progress) return { current: 0, total: 100, percent: 0 };
    if (typeof progress === "number") {
      return { current: progress, total: 100, percent: progress };
    }
    const percent = progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;
    return { ...progress, percent };
  };

  useEffect(() => {
    fetchJobs();
    // Poll faster when there are active jobs
    const interval = setInterval(fetchJobs, hasActiveJobs ? 1000 : 5000);
    return () => clearInterval(interval);
  }, [fetchJobs, hasActiveJobs]);

  const triggerJob = async (queue: string) => {
    setTriggeringQueue(queue);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queue }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to trigger job");
      }
      await fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger job");
    } finally {
      setTriggeringQueue(null);
    }
  };

  const cancelJob = async (queue: string, jobId: string) => {
    const key = `${queue}-${jobId}`;
    setCancellingJob(key);
    try {
      const res = await fetch(`/api/admin/jobs/${queue}/${jobId}?force=true`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to cancel job");
      }
      // Remove from active jobs
      setActiveJobsDetails((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      await fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel job");
    } finally {
      setCancellingJob(null);
    }
  };

  const cleanQueue = async (
    queue: string,
    type: "completed" | "failed" | "all"
  ) => {
    try {
      const res = await fetch(`/api/admin/jobs/${queue}?type=${type}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to clean queue");
      }
      await fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clean queue");
    }
  };

  const toggleQueueExpand = (queueName: string) => {
    setExpandedQueues((prev) => {
      const next = new Set(prev);
      if (next.has(queueName)) {
        next.delete(queueName);
      } else {
        next.add(queueName);
      }
      return next;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case "active":
        return <LoaderIcon className="h-4 w-4 text-blue-500 animate-spin" />;
      case "waiting":
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircleIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "il y a quelques secondes";
    if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString("fr-FR");
  };

  const getElapsedTime = (startTime: number) => {
    const elapsed = Date.now() - startTime;
    return formatDuration(elapsed);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeJobs = Object.values(activeJobsDetails);

  return (
    <div className="space-y-6">
      {/* Redis Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ServerIcon className="h-5 w-5" />
              <CardTitle>Statut Redis</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={fetchJobs}>
              <RefreshCwIcon className={`h-4 w-4 mr-2 ${hasActiveJobs ? 'animate-spin' : ''}`} />
              {hasActiveJobs ? 'Actualisation auto...' : 'Rafraîchir'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center gap-2 text-red-500">
              <XCircleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          ) : data?.redisConnected ? (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircleIcon className="h-5 w-5" />
              <span>Connecté</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-500">
              <AlertCircleIcon className="h-5 w-5" />
              <span>Non connecté</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Jobs Panel */}
      {activeJobs.length > 0 && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ActivityIcon className="h-5 w-5 text-blue-500 animate-pulse" />
              <CardTitle className="text-blue-600">
                Jobs en cours ({activeJobs.length})
              </CardTitle>
            </div>
            <CardDescription>
              Suivi en temps réel des jobs actifs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeJobs.map((job) => {
              const queueInfo = QUEUE_INFO[job.queue];
              const progress = job.progress;
              const key = `${job.queue}-${job.id}`;

              return (
                <div
                  key={key}
                  className="p-4 rounded-lg bg-background border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{queueInfo?.icon || "⚙️"}</span>
                      <div>
                        <p className="font-semibold">
                          {queueInfo?.label || job.queue}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {job.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-blue-500">
                        <LoaderIcon className="h-3 w-3 mr-1 animate-spin" />
                        En cours
                      </Badge>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => cancelJob(job.queue, job.id)}
                        disabled={cancellingJob === key}
                      >
                        {cancellingJob === key ? (
                          <LoaderIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <StopCircleIcon className="h-4 w-4 mr-1" />
                            Arrêter
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {progress.message || "Traitement en cours..."}
                      </span>
                      <span className="font-mono font-medium">
                        {progress.current}/{progress.total} ({progress.percent}%)
                      </span>
                    </div>
                    <Progress value={progress.percent} className="h-3" />
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>
                      Démarré: {job.processedOn ? formatTime(job.processedOn) : formatTime(job.timestamp)}
                    </span>
                    <span>
                      Durée: {getElapsedTime(job.processedOn || job.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Queues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(QUEUE_INFO).map(([queueName, info]) => {
          const status = data?.queues[queueName];
          const hasActive = (status?.active || 0) > 0;
          const isExpanded = expandedQueues.has(queueName);

          return (
            <Card key={queueName} className={hasActive ? "border-blue-500/30" : ""}>
              <Collapsible
                open={isExpanded}
                onOpenChange={() => toggleQueueExpand(queueName)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{info.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{info.label}</CardTitle>
                        <CardDescription className="text-xs">
                          {info.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {isExpanded ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <Button
                        size="sm"
                        onClick={() => triggerJob(queueName)}
                        disabled={triggeringQueue === queueName || hasActive}
                        title={hasActive ? "Un job est déjà en cours" : "Lancer un job"}
                      >
                        {triggeringQueue === queueName ? (
                          <LoaderIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <PlayIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {status ? (
                    <div className="space-y-3">
                      {/* Status Badges */}
                      <div className="flex gap-2 flex-wrap">
                        {status.active > 0 && (
                          <Badge variant="default" className="bg-blue-500">
                            <LoaderIcon className="h-3 w-3 mr-1 animate-spin" />
                            {status.active} actif
                          </Badge>
                        )}
                        {status.waiting > 0 && (
                          <Badge variant="outline">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {status.waiting} en attente
                          </Badge>
                        )}
                        {status.completed > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-green-600 bg-green-100 dark:bg-green-900/20"
                          >
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            {status.completed} terminé
                          </Badge>
                        )}
                        {status.failed > 0 && (
                          <Badge variant="destructive">
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            {status.failed} échoué
                          </Badge>
                        )}
                        {status.active === 0 &&
                          status.waiting === 0 &&
                          status.completed === 0 &&
                          status.failed === 0 && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Aucun job
                            </Badge>
                          )}
                      </div>

                      {/* Expanded Content */}
                      <CollapsibleContent className="space-y-3">
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cleanQueue(queueName, "completed")}
                            disabled={!status.completed}
                          >
                            <TrashIcon className="h-3 w-3 mr-1" />
                            Nettoyer terminés
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cleanQueue(queueName, "failed")}
                            disabled={!status.failed}
                          >
                            <TrashIcon className="h-3 w-3 mr-1" />
                            Nettoyer échoués
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucune donnée disponible
                    </p>
                  )}
                </CardContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Recent Jobs History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Jobs</CardTitle>
          <CardDescription>Les 30 derniers jobs exécutés</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.recentJobs && data.recentJobs.length > 0 ? (
            <div className="space-y-2">
              {data.recentJobs.map((job) => {
                const queueInfo = QUEUE_INFO[job.queue];
                return (
                  <div
                    key={`${job.queue}-${job.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <span className="text-lg">{queueInfo?.icon || "⚙️"}</span>
                      <div>
                        <p className="font-medium text-sm">
                          {queueInfo?.label || job.queue}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {job.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {job.status === "active" && (
                        <div className="flex items-center gap-2">
                          <Progress
                            value={
                              typeof job.progress === "number"
                                ? job.progress
                                : job.progress?.percent || 0
                            }
                            className="w-24 h-2"
                          />
                          <span className="text-xs font-mono">
                            {typeof job.progress === "number"
                              ? `${job.progress}%`
                              : `${job.progress?.percent || 0}%`}
                          </span>
                        </div>
                      )}
                      <div className="text-right min-w-[80px]">
                        <p className="text-sm font-mono">
                          {job.duration ? formatDuration(job.duration) : "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(job.timestamp)}
                        </p>
                      </div>
                    </div>
                    {job.failedReason && (
                      <div className="ml-4 text-xs text-red-500 max-w-xs truncate" title={job.failedReason}>
                        {job.failedReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <ClockIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucun job récent
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Lancez un job pour commencer
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

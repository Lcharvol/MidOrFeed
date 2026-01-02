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
  SquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  Loader2Icon,
  AlertCircleIcon,
  ServerIcon,
  BarChart3Icon,
  LayersIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { STATUS_STYLES } from "@/lib/styles/game-colors";
import { cn } from "@/lib/utils";

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

const QUEUE_CONFIG: Record<
  string,
  { label: string; description: string; icon: React.ReactNode }
> = {
  "champion-stats": {
    label: "Stats Champions",
    description: "Calcul des winrates, KDA, counters",
    icon: <BarChart3Icon className="size-4" />,
  },
  "composition-gen": {
    label: "Compositions",
    description: "Génération des suggestions",
    icon: <LayersIcon className="size-4" />,
  },
  "data-crawl": {
    label: "Crawl Données",
    description: "Découverte de joueurs et matchs",
    icon: <SearchIcon className="size-4" />,
  },
  "account-sync": {
    label: "Sync Comptes",
    description: "Synchronisation Riot API",
    icon: <UsersIcon className="size-4" />,
  },
};

export function JobsTab() {
  const [data, setData] = useState<JobsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggeringQueue, setTriggeringQueue] = useState<string | null>(null);
  const [cancellingJob, setCancellingJob] = useState<string | null>(null);
  const [activeJobsDetails, setActiveJobsDetails] = useState<
    Record<string, ActiveJobDetails>
  >({});

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

        // Clear old active jobs that are no longer active
        if (activeQueues.length === 0) {
          setActiveJobsDetails({});
        } else {
          for (const queueName of activeQueues) {
            fetchActiveJobDetails(queueName);
          }
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

        // Update active jobs, remove ones that are no longer active
        setActiveJobsDetails((prev) => {
          const next = { ...prev };
          // Remove jobs from this queue that are no longer in activeJobs
          Object.keys(next).forEach((key) => {
            if (
              key.startsWith(`${queueName}-`) &&
              !activeJobs.find(
                (j: { id: string }) => `${queueName}-${j.id}` === key
              )
            ) {
              delete next[key];
            }
          });
          // Add/update active jobs
          for (const job of activeJobs) {
            next[`${queueName}-${job.id}`] = {
              id: job.id,
              name: job.name,
              queue: queueName,
              progress: normalizeProgress(job.progress),
              state: job.state,
              timestamp: job.timestamp,
              processedOn: job.processedOn,
            };
          }
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to fetch active job details:", err);
    }
  };

  const normalizeProgress = (
    progress: number | JobProgress | undefined
  ): JobProgress => {
    if (!progress) return { current: 0, total: 100, percent: 0 };
    if (typeof progress === "number") {
      return { current: progress, total: 100, percent: progress };
    }
    const percent =
      progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0;
    return { ...progress, percent };
  };

  useEffect(() => {
    fetchJobs();
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
      toast.success(`Job ${QUEUE_CONFIG[queue]?.label || queue} lancé`);
      await fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
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
      setActiveJobsDetails((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast.success("Job annulé");
      await fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setCancellingJob(null);
    }
  };

  const cleanQueue = async (
    queue: string,
    type: "completed" | "failed"
  ) => {
    try {
      const res = await fetch(`/api/admin/jobs/${queue}?type=${type}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to clean queue");
      }
      toast.success(`Jobs ${type === "completed" ? "terminés" : "échoués"} nettoyés`);
      await fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className={cn("size-4", STATUS_STYLES.success.icon)} />;
      case "failed":
        return <XCircleIcon className={cn("size-4", STATUS_STYLES.error.icon)} />;
      case "active":
        return <Loader2Icon className={cn("size-4 animate-spin", STATUS_STYLES.info.icon)} />;
      case "waiting":
        return <ClockIcon className={cn("size-4", STATUS_STYLES.warning.icon)} />;
      default:
        return <AlertCircleIcon className={cn("size-4", STATUS_STYLES.pending.icon)} />;
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

    if (diff < 60000) return "à l'instant";
    if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)}min`;
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
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeJobs = Object.values(activeJobsDetails);

  return (
    <div className="space-y-6">
      {/* Redis Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <ServerIcon className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Connexion Redis</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={fetchJobs}>
            <RefreshCwIcon
              className={`size-4 mr-2 ${hasActiveJobs ? "animate-spin" : ""}`}
            />
            {hasActiveJobs ? "Auto..." : "Rafraîchir"}
          </Button>
        </CardHeader>
        <CardContent>
          {error ? (
            <Badge variant="destructive">{error}</Badge>
          ) : data?.redisConnected ? (
            <Badge variant="success">Connecté</Badge>
          ) : (
            <Badge variant="outline">Non connecté</Badge>
          )}
        </CardContent>
      </Card>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <Card className={cn("border-l-4", STATUS_STYLES.info.border)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2Icon className={cn("size-4 animate-spin", STATUS_STYLES.info.icon)} />
              Jobs en cours ({activeJobs.length})
            </CardTitle>
            <CardDescription>Suivi en temps réel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeJobs.map((job) => {
              const config = QUEUE_CONFIG[job.queue];
              const progress = job.progress;
              const key = `${job.queue}-${job.id}`;

              return (
                <div
                  key={key}
                  className="p-4 rounded-lg border bg-muted/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-md", STATUS_STYLES.info.bg, STATUS_STYLES.info.icon)}>
                        {config?.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {config?.label || job.queue}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {job.id}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => cancelJob(job.queue, job.id)}
                      disabled={cancellingJob === key}
                    >
                      {cancellingJob === key ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <>
                          <SquareIcon className="size-4 mr-1" />
                          Arrêter
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {progress.message || "Traitement en cours..."}
                      </span>
                      <span className="font-mono text-xs">
                        {progress.current}/{progress.total} ({progress.percent}%)
                      </span>
                    </div>
                    <Progress value={progress.percent} className="h-2" />
                  </div>

                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>
                      Démarré:{" "}
                      {formatTime(job.processedOn || job.timestamp)}
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

      {/* Queue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(QUEUE_CONFIG).map(([queueName, config]) => {
          const status = data?.queues[queueName];
          const hasActive = (status?.active || 0) > 0;

          return (
            <Card
              key={queueName}
              className={hasActive ? cn("border-l-4", STATUS_STYLES.info.border) : ""}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <div className="text-muted-foreground">{config.icon}</div>
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {config.label}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {config.description}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => triggerJob(queueName)}
                  disabled={triggeringQueue === queueName || hasActive}
                >
                  {triggeringQueue === queueName ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <PlayIcon className="size-4" />
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {status ? (
                  <div className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      {status.active > 0 && (
                        <Badge variant="default">
                          {status.active} actif
                        </Badge>
                      )}
                      {status.waiting > 0 && (
                        <Badge variant="outline">{status.waiting} en attente</Badge>
                      )}
                      {status.completed > 0 && (
                        <Badge variant="success">{status.completed} terminé</Badge>
                      )}
                      {status.failed > 0 && (
                        <Badge variant="destructive">{status.failed} échoué</Badge>
                      )}
                      {status.active === 0 &&
                        status.waiting === 0 &&
                        status.completed === 0 &&
                        status.failed === 0 && (
                          <span className="text-xs text-muted-foreground">
                            Aucun job
                          </span>
                        )}
                    </div>

                    {(status.completed > 0 || status.failed > 0) && (
                      <div className="flex gap-2">
                        {status.completed > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cleanQueue(queueName, "completed")}
                          >
                            <TrashIcon className="size-3 mr-1" />
                            Nettoyer
                          </Button>
                        )}
                        {status.failed > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cleanQueue(queueName, "failed")}
                            className={STATUS_STYLES.error.text}
                          >
                            <TrashIcon className="size-3 mr-1" />
                            Échoués
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Aucune donnée
                  </span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Job History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Historique</CardTitle>
          <CardDescription>Les 30 derniers jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.recentJobs && data.recentJobs.length > 0 ? (
            <div className="rounded-md border bg-muted/20 divide-y">
              {data.recentJobs.slice(0, 15).map((job) => {
                const config = QUEUE_CONFIG[job.queue];
                return (
                  <div
                    key={`${job.queue}-${job.id}`}
                    className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div className="text-muted-foreground">{config?.icon}</div>
                      <div>
                        <p className="text-sm font-medium">
                          {config?.label || job.queue}
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
                            className="w-20 h-1.5"
                          />
                        </div>
                      )}
                      <div className="text-right min-w-[70px]">
                        <p className="text-xs font-mono">
                          {job.duration ? formatDuration(job.duration) : "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(job.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ClockIcon className="size-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun job récent</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

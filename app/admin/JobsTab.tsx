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
  BarChart3Icon,
  LayersIcon,
  SearchIcon,
  UsersIcon,
  TrophyIcon,
  ImageIcon,
  BrainIcon,
  SwordsIcon,
  ShieldIcon,
  EraserIcon,
  UserCheckIcon,
  CalendarIcon,
  DatabaseIcon,
} from "lucide-react";
import { toast } from "sonner";
import { STATUS_STYLES } from "@/lib/styles/game-colors";
import { cn } from "@/lib/utils";
import { WORKER_DESCRIPTIONS } from "@/lib/workers/descriptions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JobProgress {
  current: number;
  total: number;
  message?: string;
  percent?: number;
}

interface QueueStatus {
  waiting: number;
  active: number;
  total: number;
  deferred: number;
}

interface RecentJob {
  id: string;
  queue: string;
  name: string;
  state: string;
  timestamp: number;
  startedOn?: number;
  completedOn?: number;
  duration?: number;
  retryCount?: number;
  output?: Record<string, unknown> | null;
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
  connected: boolean;
  queues: Record<string, QueueStatus>;
  recentJobs: RecentJob[];
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Queue configuration — all 12 queues, grouped by category
// ---------------------------------------------------------------------------

interface QueueConfig {
  label: string;
  description: string;
  icon: React.ReactNode;
  category: "analysis" | "sync" | "maintenance";
}

const QUEUE_ICONS: Record<string, React.ReactNode> = {
  "champion-stats": <BarChart3Icon className="size-4" />,
  "composition-gen": <LayersIcon className="size-4" />,
  "data-crawl": <SearchIcon className="size-4" />,
  "account-sync": <UsersIcon className="size-4" />,
  "leaderboard-sync": <TrophyIcon className="size-4" />,
  "ddragon-sync": <ImageIcon className="size-4" />,
  "meta-analysis": <BrainIcon className="size-4" />,
  "synergy-analysis": <SwordsIcon className="size-4" />,
  "item-builds": <ShieldIcon className="size-4" />,
  "data-cleanup": <EraserIcon className="size-4" />,
  "account-refresh": <UserCheckIcon className="size-4" />,
  "daily-reset": <CalendarIcon className="size-4" />,
};

const QUEUE_CATEGORIES: Record<string, "analysis" | "sync" | "maintenance"> = {
  "champion-stats": "analysis",
  "composition-gen": "analysis",
  "data-crawl": "analysis",
  "meta-analysis": "analysis",
  "synergy-analysis": "analysis",
  "item-builds": "analysis",
  "account-sync": "sync",
  "leaderboard-sync": "sync",
  "ddragon-sync": "sync",
  "account-refresh": "sync",
  "data-cleanup": "maintenance",
  "daily-reset": "maintenance",
};

const CATEGORY_LABELS: Record<string, string> = {
  analysis: "Analyse & Données",
  sync: "Synchronisation",
  maintenance: "Maintenance",
};

function buildQueueConfig(): Record<string, QueueConfig> {
  const config: Record<string, QueueConfig> = {};
  for (const [key, desc] of Object.entries(WORKER_DESCRIPTIONS)) {
    config[key] = {
      label: desc.name,
      description: desc.description,
      icon: QUEUE_ICONS[key] || <DatabaseIcon className="size-4" />,
      category: QUEUE_CATEGORIES[key] || "maintenance",
    };
  }
  return config;
}

const QUEUE_CONFIG = buildQueueConfig();

// ---------------------------------------------------------------------------
// State badge for pg-boss job states
// ---------------------------------------------------------------------------

function StateBadge({ state }: { state: string }) {
  switch (state) {
    case "completed":
      return <Badge variant="success">completed</Badge>;
    case "failed":
      return <Badge variant="destructive">failed</Badge>;
    case "active":
      return <Badge variant="info">active</Badge>;
    case "created":
      return <Badge variant="outline">created</Badge>;
    case "cancelled":
      return <Badge variant="warning">cancelled</Badge>;
    default:
      return <Badge variant="outline">{state}</Badge>;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

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

        setActiveJobsDetails((prev) => {
          const next = { ...prev };
          // Remove jobs from this queue that are no longer active
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
          for (const job of activeJobs) {
            next[`${queueName}-${job.id}`] = {
              id: job.id,
              name: job.name,
              queue: queueName,
              progress: normalizeProgress(job.progress),
              state: job.state,
              timestamp: job.createdOn || job.timestamp,
              processedOn: job.startedOn,
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

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

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

  const cleanQueue = async (queue: string) => {
    try {
      const res = await fetch(`/api/admin/jobs/${queue}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to clean queue");
      }
      toast.success("Jobs nettoyés");
      await fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  const getStatusIcon = (state: string) => {
    switch (state) {
      case "completed":
        return <CheckCircleIcon className={cn("size-4", STATUS_STYLES.success.icon)} />;
      case "failed":
        return <XCircleIcon className={cn("size-4", STATUS_STYLES.error.icon)} />;
      case "active":
        return <Loader2Icon className={cn("size-4 animate-spin", STATUS_STYLES.info.icon)} />;
      case "created":
        return <ClockIcon className={cn("size-4", STATUS_STYLES.warning.icon)} />;
      case "cancelled":
        return <AlertCircleIcon className={cn("size-4", STATUS_STYLES.pending.icon)} />;
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

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeJobs = Object.values(activeJobsDetails);

  // Group queues by category
  const queuesByCategory = Object.entries(QUEUE_CONFIG).reduce(
    (acc, [name, config]) => {
      const cat = config.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(name);
      return acc;
    },
    {} as Record<string, string[]>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">pg-boss</h2>
          {error ? (
            <Badge variant="destructive">Erreur</Badge>
          ) : data?.connected ? (
            <Badge variant="success">Connecté</Badge>
          ) : (
            <Badge variant="outline">Non connecté</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchJobs}>
          <RefreshCwIcon
            className={cn("size-4 mr-2", hasActiveJobs && "animate-spin")}
          />
          {hasActiveJobs ? "Auto..." : "Rafraîchir"}
        </Button>
      </div>

      {error && (
        <Card className={cn("border-l-4", STATUS_STYLES.error.border)}>
          <CardContent className="py-3">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

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

      {/* Queue Cards by Category */}
      {(["analysis", "sync", "maintenance"] as const).map((category) => {
        const queues = queuesByCategory[category];
        if (!queues || queues.length === 0) return null;

        return (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {CATEGORY_LABELS[category]}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {queues.map((queueName) => {
                const config = QUEUE_CONFIG[queueName];
                const status = data?.queues[queueName];
                const hasActive = (status?.active || 0) > 0;

                return (
                  <Card
                    key={queueName}
                    className={hasActive ? cn("border-l-4", STATUS_STYLES.info.border) : ""}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-muted-foreground shrink-0">{config.icon}</div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm font-medium truncate">
                            {config.label}
                          </CardTitle>
                          <CardDescription className="text-xs line-clamp-2">
                            {config.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="shrink-0 ml-2"
                        onClick={() => triggerJob(queueName)}
                        disabled={triggeringQueue === queueName || hasActive}
                        aria-label={`Lancer ${config.label}`}
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
                            {status.deferred > 0 && (
                              <Badge variant="warning">{status.deferred} différé</Badge>
                            )}
                            {status.total > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {status.total} total
                              </span>
                            )}
                            {status.active === 0 &&
                              status.waiting === 0 &&
                              status.deferred === 0 &&
                              status.total === 0 && (
                                <span className="text-xs text-muted-foreground">
                                  Aucun job
                                </span>
                              )}
                          </div>

                          {status.total > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cleanQueue(queueName)}
                            >
                              <TrashIcon className="size-3 mr-1" />
                              Purger
                            </Button>
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
          </div>
        );
      })}

      {/* Job History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Historique</CardTitle>
          <CardDescription>Les 30 derniers jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.recentJobs && data.recentJobs.length > 0 ? (
            <div className="rounded-md border bg-muted/20 divide-y">
              {data.recentJobs.map((job) => {
                const config = QUEUE_CONFIG[job.queue];
                return (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {getStatusIcon(job.state)}
                      <div className="text-muted-foreground shrink-0">{config?.icon}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {config?.label || job.queue}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {job.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StateBadge state={job.state} />
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

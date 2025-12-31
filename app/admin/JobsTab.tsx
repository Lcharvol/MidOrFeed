"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
} from "lucide-react";

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
  progress: number;
  timestamp: number;
  duration?: number;
  failedReason?: string;
}

interface JobsData {
  redisConnected: boolean;
  queues: Record<string, QueueStatus>;
  recentJobs: Job[];
  timestamp: number;
}

const QUEUE_INFO: Record<string, { label: string; description: string }> = {
  "champion-stats": {
    label: "Stats Champions",
    description: "Calcul des winrates, KDA, counters par champion",
  },
  "composition-gen": {
    label: "Compositions",
    description: "Génération des suggestions de compositions",
  },
  "data-crawl": {
    label: "Crawl Données",
    description: "Découverte de joueurs et collecte de matchs",
  },
  "account-sync": {
    label: "Sync Comptes",
    description: "Synchronisation des comptes via Riot API",
  },
};

export function JobsTab() {
  const [data, setData] = useState<JobsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggeringQueue, setTriggeringQueue] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/jobs");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch jobs");
      }
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    // Poll every 3 seconds
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

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
      // Refresh data
      await fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger job");
    } finally {
      setTriggeringQueue(null);
    }
  };

  const cleanQueue = async (queue: string, type: "completed" | "failed" | "all") => {
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
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "il y a quelques secondes";
    if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)} h`;
    return date.toLocaleDateString("fr-FR");
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Rafraîchir
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

      {/* Queues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(QUEUE_INFO).map(([queueName, info]) => {
          const status = data?.queues[queueName];
          const hasActiveJobs = (status?.active || 0) > 0;

          return (
            <Card key={queueName}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{info.label}</CardTitle>
                    <CardDescription>{info.description}</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => triggerJob(queueName)}
                    disabled={triggeringQueue === queueName || hasActiveJobs}
                  >
                    {triggeringQueue === queueName ? (
                      <LoaderIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlayIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {status ? (
                  <div className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      {status.active > 0 && (
                        <Badge variant="default" className="bg-blue-500">
                          {status.active} actif
                        </Badge>
                      )}
                      {status.waiting > 0 && (
                        <Badge variant="outline">
                          {status.waiting} en attente
                        </Badge>
                      )}
                      {status.completed > 0 && (
                        <Badge variant="secondary" className="text-green-600">
                          {status.completed} terminé
                        </Badge>
                      )}
                      {status.failed > 0 && (
                        <Badge variant="destructive">
                          {status.failed} échoué
                        </Badge>
                      )}
                    </div>
                    {hasActiveJobs && (
                      <Progress value={50} className="h-2" />
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cleanQueue(queueName, "completed")}
                        disabled={!status.completed}
                      >
                        <TrashIcon className="h-3 w-3 mr-1" />
                        Nettoyer terminés
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucune donnée disponible
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Jobs</CardTitle>
          <CardDescription>Les 30 derniers jobs exécutés</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.recentJobs && data.recentJobs.length > 0 ? (
            <div className="space-y-2">
              {data.recentJobs.map((job) => (
                <div
                  key={`${job.queue}-${job.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <p className="font-medium text-sm">
                        {QUEUE_INFO[job.queue]?.label || job.queue}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {job.duration ? formatDuration(job.duration) : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(job.timestamp)}
                    </p>
                  </div>
                  {job.failedReason && (
                    <div className="ml-4 text-xs text-red-500 max-w-xs truncate">
                      {job.failedReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun job récent
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

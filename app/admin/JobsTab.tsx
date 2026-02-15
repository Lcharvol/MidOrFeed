"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCwIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { STATUS_STYLES } from "@/lib/styles/game-colors";
import { cn } from "@/lib/utils";
import { authenticatedFetch } from "@/lib/api-client";

import { ActiveJobsList } from "./components/jobs/ActiveJobsList";
import { QueueCategoryGroup } from "./components/jobs/QueueStatusCard";
import { JobHistoryTable } from "./components/jobs/JobHistoryTable";
import {
  QUEUE_CONFIG,
  normalizeProgress,
  type JobsData,
  type QueueStatus,
  type ActiveJobDetails,
} from "./components/jobs/constants";

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
      const res = await authenticatedFetch("/api/admin/jobs");
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
      const res = await authenticatedFetch(`/api/admin/jobs/${queueName}`);
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
      // Analyze items uses a direct endpoint (no pg-boss worker)
      if (queue === "analyze-items") {
        const res = await authenticatedFetch("/api/admin/analyze-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to analyze items");
        }
        const d = json.data;
        toast.success(
          `Item Stats : ${d.totalItems} items analysés (${d.created} créés, ${d.updated} mis à jour)`
        );
        await fetchJobs();
        return;
      }

      // Leaderboard sync uses a direct endpoint (bypasses pg-boss for reliability)
      if (queue === "leaderboard-sync") {
        const res = await authenticatedFetch("/api/admin/leaderboard/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to sync leaderboard");
        }
        const count = json.entriesSynced ?? 0;
        const errCount = json.errors?.length ?? 0;
        toast.success(
          `Leaderboard sync\u00e9 : ${count} entr\u00e9es${errCount > 0 ? ` (${errCount} erreurs)` : ""}`
        );
        await fetchJobs();
        return;
      }

      const res = await authenticatedFetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queue }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to trigger job");
      }
      toast.success(`Job ${QUEUE_CONFIG[queue]?.label || queue} lanc\u00e9`);
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
      const res = await authenticatedFetch(`/api/admin/jobs/${queue}/${jobId}?force=true`, {
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
      toast.success("Job annul\u00e9");
      await fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setCancellingJob(null);
    }
  };

  const cleanQueue = async (queue: string) => {
    try {
      const res = await authenticatedFetch(`/api/admin/jobs/${queue}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to clean queue");
      }
      toast.success("Jobs nettoy\u00e9s");
      await fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
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
            <Badge variant="success">Connect\u00e9</Badge>
          ) : (
            <Badge variant="outline">Non connect\u00e9</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchJobs}>
          <RefreshCwIcon
            className={cn("size-4 mr-2", hasActiveJobs && "animate-spin")}
          />
          {hasActiveJobs ? "Auto..." : "Rafra\u00eechir"}
        </Button>
      </div>

      {error && (
        <Card className={cn("border-l-4", STATUS_STYLES.error.border)}>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Active Jobs */}
      <ActiveJobsList
        activeJobs={activeJobs}
        cancellingJob={cancellingJob}
        onCancelJob={cancelJob}
      />

      {/* Queue Cards by Category */}
      {(["analysis", "sync", "maintenance"] as const).map((category) => (
        <QueueCategoryGroup
          key={category}
          category={category}
          queueNames={queuesByCategory[category] || []}
          queues={data?.queues}
          schedules={data?.schedules}
          triggeringQueue={triggeringQueue}
          onTriggerJob={triggerJob}
          onCleanQueue={cleanQueue}
        />
      ))}

      {/* Job History */}
      <JobHistoryTable recentJobs={data?.recentJobs} />
    </div>
  );
}

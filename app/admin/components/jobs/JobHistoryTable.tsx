"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  Loader2Icon,
  AlertCircleIcon,
} from "lucide-react";
import { STATUS_STYLES } from "@/lib/styles/game-colors";
import { cn } from "@/lib/utils";
import {
  QUEUE_CONFIG,
  formatDuration,
  formatTime,
  type RecentJob,
} from "./constants";

// ---------------------------------------------------------------------------
// StateBadge - Badge for pg-boss job states
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
// getStatusIcon - Icon for pg-boss job states
// ---------------------------------------------------------------------------

function getStatusIcon(state: string) {
  switch (state) {
    case "completed":
      return (
        <CheckCircleIcon
          className={cn("size-4", STATUS_STYLES.success.icon)}
        />
      );
    case "failed":
      return (
        <XCircleIcon className={cn("size-4", STATUS_STYLES.error.icon)} />
      );
    case "active":
      return (
        <Loader2Icon
          className={cn("size-4 animate-spin", STATUS_STYLES.info.icon)}
        />
      );
    case "created":
      return (
        <ClockIcon className={cn("size-4", STATUS_STYLES.warning.icon)} />
      );
    case "cancelled":
      return (
        <AlertCircleIcon
          className={cn("size-4", STATUS_STYLES.pending.icon)}
        />
      );
    default:
      return (
        <AlertCircleIcon
          className={cn("size-4", STATUS_STYLES.pending.icon)}
        />
      );
  }
}

// ---------------------------------------------------------------------------
// JobHistoryTable - Shows the 30 most recent jobs
// ---------------------------------------------------------------------------

interface JobHistoryTableProps {
  recentJobs: RecentJob[] | undefined;
}

export function JobHistoryTable({ recentJobs }: JobHistoryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Historique</CardTitle>
        <CardDescription>Les 30 derniers jobs</CardDescription>
      </CardHeader>
      <CardContent>
        {recentJobs && recentJobs.length > 0 ? (
          <div className="rounded-md border bg-muted/20 divide-y">
            {recentJobs.map((job) => {
              const config = QUEUE_CONFIG[job.queue];
              return (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getStatusIcon(job.state)}
                    <div className="text-muted-foreground shrink-0">
                      {config?.icon}
                    </div>
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
            <p className="text-sm">Aucun job r\u00e9cent</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

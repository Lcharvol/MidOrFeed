"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2Icon, SquareIcon } from "lucide-react";
import { STATUS_STYLES } from "@/lib/styles/game-colors";
import { cn } from "@/lib/utils";
import {
  QUEUE_CONFIG,
  formatTime,
  getElapsedTime,
  type ActiveJobDetails,
} from "./constants";

// ---------------------------------------------------------------------------
// ActiveJobsList - Shows currently running jobs with progress bars
// ---------------------------------------------------------------------------

interface ActiveJobsListProps {
  activeJobs: ActiveJobDetails[];
  cancellingJob: string | null;
  onCancelJob: (queue: string, jobId: string) => void;
}

export function ActiveJobsList({
  activeJobs,
  cancellingJob,
  onCancelJob,
}: ActiveJobsListProps) {
  if (activeJobs.length === 0) return null;

  return (
    <Card className={cn("border-l-4", STATUS_STYLES.info.border)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2Icon
            className={cn("size-4 animate-spin", STATUS_STYLES.info.icon)}
          />
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
                  <div
                    className={cn(
                      "p-2 rounded-md",
                      STATUS_STYLES.info.bg,
                      STATUS_STYLES.info.icon
                    )}
                  >
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
                  onClick={() => onCancelJob(job.queue, job.id)}
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
  );
}

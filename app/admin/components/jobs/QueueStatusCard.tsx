"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayIcon, Loader2Icon, TrashIcon, ClockIcon } from "lucide-react";
import { STATUS_STYLES } from "@/lib/styles/game-colors";
import { cn } from "@/lib/utils";
import {
  QUEUE_CONFIG,
  CATEGORY_LABELS,
  formatCron,
  type QueueStatus,
  type ScheduleInfo,
} from "./constants";

// ---------------------------------------------------------------------------
// QueueStatusCard - A single queue card with status and actions
// ---------------------------------------------------------------------------

interface QueueStatusCardProps {
  queueName: string;
  status: QueueStatus | undefined;
  schedule?: ScheduleInfo;
  triggeringQueue: string | null;
  onTriggerJob: (queue: string) => void;
  onCleanQueue: (queue: string) => void;
}

export function QueueStatusCard({
  queueName,
  status,
  schedule,
  triggeringQueue,
  onTriggerJob,
  onCleanQueue,
}: QueueStatusCardProps) {
  const config = QUEUE_CONFIG[queueName];
  const hasActive = (status?.active || 0) > 0;

  return (
    <Card
      className={
        hasActive ? cn("border-l-4", STATUS_STYLES.info.border) : ""
      }
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
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <ClockIcon className="size-3 shrink-0" />
              {schedule ? (
                <span title={schedule.cron}>{formatCron(schedule.cron)}</span>
              ) : (
                <span>Non planifié</span>
              )}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          className="shrink-0 ml-2"
          onClick={() => onTriggerJob(queueName)}
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
                <Badge variant="default">{status.active} actif</Badge>
              )}
              {status.waiting > 0 && (
                <Badge variant="outline">
                  {status.waiting} en attente
                </Badge>
              )}
              {status.deferred > 0 && (
                <Badge variant="warning">
                  {status.deferred} diff\u00e9r\u00e9
                </Badge>
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
                onClick={() => onCleanQueue(queueName)}
              >
                <TrashIcon className="size-3 mr-1" />
                Purger
              </Button>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            Aucune donn\u00e9e
          </span>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// QueueCategoryGroup - A category section with its queue cards
// ---------------------------------------------------------------------------

interface QueueCategoryGroupProps {
  category: "analysis" | "sync" | "maintenance";
  queueNames: string[];
  queues: Record<string, QueueStatus> | undefined;
  schedules?: Record<string, ScheduleInfo>;
  triggeringQueue: string | null;
  onTriggerJob: (queue: string) => void;
  onCleanQueue: (queue: string) => void;
}

export function QueueCategoryGroup({
  category,
  queueNames,
  queues,
  schedules,
  triggeringQueue,
  onTriggerJob,
  onCleanQueue,
}: QueueCategoryGroupProps) {
  if (!queueNames || queueNames.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {CATEGORY_LABELS[category]}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {queueNames.map((queueName) => (
          <QueueStatusCard
            key={queueName}
            queueName={queueName}
            status={queues?.[queueName]}
            schedule={schedules?.[queueName]}
            triggeringQueue={triggeringQueue}
            onTriggerJob={onTriggerJob}
            onCleanQueue={onCleanQueue}
          />
        ))}
      </div>
    </div>
  );
}

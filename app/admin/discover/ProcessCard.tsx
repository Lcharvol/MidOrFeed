"use client";

import { useState } from "react";
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
import { Loader2Icon, PlayIcon } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n-context";
import { MATCHES_FETCH_LIMIT } from "@/constants/matches";

interface ProcessCardProps {
  pendingCount: number;
  crawlingCount: number;
  completedCount: number;
  failedCount?: number;
  onProcessComplete: () => void;
}

export function ProcessCard({
  pendingCount,
  crawlingCount,
  completedCount,
  failedCount = 0,
  onProcessComplete,
}: ProcessCardProps) {
  const { t } = useI18n();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [processController, setProcessController] =
    useState<AbortController | null>(null);
  const [isRetryingFailed, setIsRetryingFailed] = useState(false);

  const handleProcess = async () => {
    const controller = new AbortController();
    setProcessController(controller);
    setIsProcessing(true);

    try {
      const response = await fetch("/api/crawl/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(t("admin.discover.processCard.matchesCollected").replace("{count}", result.data.matchesCollected.toString()));
        onProcessComplete();
      } else {
        toast.error(result.error || t("admin.discover.processCard.errorProcessing"));
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        toast.info(t("admin.discover.processCard.processingCancelled"));
      } else {
        console.error("Erreur:", error);
        toast.error(t("admin.discover.processCard.errorOccurred"));
      }
    } finally {
      setIsProcessing(false);
      setProcessController(null);
    }
  };

  const handleCancelProcess = async () => {
    if (processController) {
      setIsCancelling(true);
      processController.abort();
      setProcessController(null);
      setIsCancelling(false);
      setIsProcessing(false);
      toast.info(t("admin.discover.processCard.stopping"));
    }
  };

  const totalInProgress = completedCount + pendingCount + crawlingCount;
  const progressPercent =
    totalInProgress > 0 ? (completedCount / totalInProgress) * 100 : 0;

  return (
    <Card variant="gradient">
      <CardHeader withGlow>
        <CardTitle>{t("admin.discover.processCard.title")}</CardTitle>
        <CardDescription>{t("admin.discover.processCard.description")}</CardDescription>
        <CardAction>
          <div className="flex gap-2">
            <Button
              onClick={handleProcess}
              disabled={isProcessing || pendingCount === 0}
              className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              size="sm"
            >
              {isProcessing ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  {t("admin.discover.processCard.processing")}
                </>
              ) : (
                <>
                  <PlayIcon className="mr-2 size-4" />
                  {t("admin.discover.processCard.start")}
                </>
              )}
            </Button>
            {isProcessing && (
              <Button
                onClick={handleCancelProcess}
                disabled={isCancelling}
                variant="destructive"
                size="sm"
              >
                {isCancelling ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    {t("admin.discover.processCard.stopping")}
                  </>
                ) : (
                  <>{t("admin.discover.processCard.stop")}</>
                )}
              </Button>
            )}
            <Button
              onClick={async () => {
                try {
                  setIsRetryingFailed(true);
                  const res = await fetch("/api/crawl/retry-failed", {
                    method: "POST",
                  });
                  const data = await res.json();
                  if (res.ok) {
                    toast.success(
                      data.message || t("admin.discover.processCard.failedPlayersReset")
                    );
                    onProcessComplete();
                  } else {
                    toast.error(
                      data.error || t("admin.discover.processCard.errorReset")
                    );
                  }
                } catch (e) {
                  console.error(e);
                  toast.error(t("admin.discover.processCard.errorOccurred"));
                } finally {
                  setIsRetryingFailed(false);
                }
              }}
              disabled={isProcessing || isRetryingFailed || failedCount === 0}
              variant="outline"
              size="sm"
            >
              {isRetryingFailed ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Relance...
                </>
              ) : (
                <>{t("admin.discover.processCard.restartFailed")}</>
              )}
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Badge variant="warning">{t("admin.discover.processCard.pendingPlayers")}: {pendingCount}</Badge>
          {crawlingCount > 0 && (
            <Badge variant="info">{t("admin.discover.processCard.inProgress")}: {crawlingCount}</Badge>
          )}
          {failedCount > 0 && (
            <Badge variant="destructive">{t("admin.discover.processCard.failed")}: {failedCount}</Badge>
          )}
        </div>

        {/* Barre de progression */}
        {isProcessing && totalInProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("admin.discover.processCard.progress")}</span>
              <span className="font-medium">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <Progress value={progressPercent} />
          </div>
        )}

        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            {t("admin.discover.processCard.commandDescription").replace("{limit}", MATCHES_FETCH_LIMIT.toString())}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

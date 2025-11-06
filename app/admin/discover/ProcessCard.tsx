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
        toast.success(`${result.data.matchesCollected} matchs collectés`);
        onProcessComplete();
      } else {
        toast.error(result.error || "Erreur lors du traitement");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        toast.info("Traitement annulé");
      } else {
        console.error("Erreur:", error);
        toast.error("Une erreur est survenue");
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
      toast.info("Arrêt du traitement en cours...");
    }
  };

  const totalInProgress = completedCount + pendingCount + crawlingCount;
  const progressPercent =
    totalInProgress > 0 ? (completedCount / totalInProgress) * 100 : 0;

  return (
    <Card variant="gradient">
      <CardHeader withGlow>
        <CardTitle>Traitement des joueurs</CardTitle>
        <CardDescription>Crawler tous les joueurs en attente</CardDescription>
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
                  Traitement...
                </>
              ) : (
                <>
                  <PlayIcon className="mr-2 size-4" />
                  Démarrer
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
                    Arrêt...
                  </>
                ) : (
                  <>Arrêter</>
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
                      data.message || "Joueurs failed remis en pending"
                    );
                    onProcessComplete();
                  } else {
                    toast.error(
                      data.error || "Erreur lors de la réinitialisation"
                    );
                  }
                } catch (e) {
                  console.error(e);
                  toast.error("Une erreur est survenue");
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
                <>Relancer failed</>
              )}
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Badge variant="warning">Joueurs en attente: {pendingCount}</Badge>
          {crawlingCount > 0 && (
            <Badge variant="info">En cours: {crawlingCount}</Badge>
          )}
          {failedCount > 0 && (
            <Badge variant="destructive">En échec: {failedCount}</Badge>
          )}
        </div>

        {/* Barre de progression */}
        {isProcessing && totalInProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <Progress value={progressPercent} />
          </div>
        )}

        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            Cette commande traite TOUS les joueurs en attente et collecte
            jusqu&apos;à 100 matchs par joueur.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

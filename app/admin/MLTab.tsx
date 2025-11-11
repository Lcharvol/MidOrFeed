"use client";

import useSWR from "swr";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ColorBadge } from "@/components/ui/color-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2Icon, DatabaseIcon, BarChart3Icon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type MlStatus = {
  dataset: FileStatus;
  runs: Array<{
    id: string;
    startedAt: string;
    finishedAt: string | null;
    status: string;
    message: string | null;
  }>;
  championSummary: Array<{
    championId: string;
    winProbability: number;
    sampleCount: number;
  }>;
  matchSamples: Array<{
    matchId: string | null;
    participantPUuid: string | null;
    championId: string;
    winProbability: number;
  }>;
};

type FileStatus = {
  exists: boolean;
  size?: number;
  updatedAt?: string;
  path: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const formatBytes = (bytes?: number) => {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

const formatDate = (value?: string) => {
  if (!value) return "Jamais";
  return new Date(value).toLocaleString("fr-FR");
};

const infoCards = [
  {
    key: "dataset" as const,
    title: "Dataset",
    description: "Extraction CSV des matchs",
    icon: DatabaseIcon,
  },
];

export const MLTab = () => {
  const { data, isLoading, mutate } = useSWR<{
    success: boolean;
    data: MlStatus;
  }>("/api/admin/ml/status", fetcher, {
    refreshInterval: 15_000,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [lastLogs, setLastLogs] = useState<string | null>(null);

  const triggerExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/admin/ml/export", { method: "POST" });
      const json = await response.json();
      if (!response.ok || !json.success) {
        toast.error(json.error || "Échec de l'export");
        return;
      }
      toast.success(
        `Export terminé (${
          json.data?.total ?? "?"
        } lignes). Relance l'entraînement côté Python.`
      );
      await mutate();
    } catch (error) {
      console.error(error);
      toast.error("Erreur réseau");
    } finally {
      setIsExporting(false);
    }
  };

  const triggerTraining = async () => {
    setIsTraining(true);
    setLastLogs(null);
    try {
      const response = await fetch("/api/admin/ml/train", { method: "POST" });
      const json = await response.json();
      if (!response.ok || !json.success) {
        toast.error(json.error || "Échec du run ML");
        return;
      }
      setLastLogs(json.data?.stdout ?? null);
      toast.success("Entraînement ML terminé");
      await mutate();
    } catch (error) {
      console.error(error);
      toast.error("Erreur réseau lors du run ML");
    } finally {
      setIsTraining(false);
    }
  };

  const status = data?.data;
  const latestRun = status?.runs?.[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Machine Learning</CardTitle>
          <CardDescription>
            Orchestration de l&apos;export des matches, entraînement Python et
            publication des prédictions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={triggerExport} disabled={isExporting} size="sm">
              {isExporting ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Export en cours...
                </>
              ) : (
                "Exporter les matches"
              )}
            </Button>
            <Button
              onClick={triggerTraining}
              disabled={
                isExporting ||
                isTraining ||
                latestRun?.status?.toLowerCase() === "running"
              }
              size="sm"
              variant="secondary"
            >
              {isTraining ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Entraînement…
                </>
              ) : (
                "Lancer entraînement ML"
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(
                  "cd ml && source .venv/bin/activate && pnpm ml:train"
                );
                toast.success("Commande locale copiée dans le presse-papiers");
              }}
            >
              Copier la commande locale
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Le bouton ci-dessus exécute le pipeline complet en production
            (export, entraînement, insertion des prédictions). Pour expérimenter
            en local, utilise la commande copiée (nécessite un venv Python).
          </p>
          {lastLogs && (
            <div className="rounded-md bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-2">
                Derniers logs
              </p>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs">
                {lastLogs}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {infoCards.map(({ key, title, description, icon: Icon }) => {
          const fileStatus = status?.[key];
          return (
            <Card key={key} className="border-2 border-primary/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="size-5 text-primary" />
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{description}</p>
                <Separator />
                <div className="text-sm space-y-1">
                  <p>
                    Statut :{" "}
                    <ColorBadge
                      emphasis={fileStatus?.exists ? "positive" : "warning"}
                      variant="subtle"
                      className="px-2.5 py-0.5 text-[0.7rem]"
                    >
                      {fileStatus?.exists ? "Disponible" : "Manquant"}
                    </ColorBadge>
                  </p>
                  <p>Taille : {formatBytes(fileStatus?.size)}</p>
                  <p>MAJ : {formatDate(fileStatus?.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        <Card className="border-2 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Derniers runs</CardTitle>
            <BarChart3Icon className="size-5 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {status?.runs?.length ? (
              status.runs.map((run) => (
                <div
                  key={run.id}
                  className="rounded border border-border/50 bg-muted/20 p-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{run.status}</span>
                    <span>
                      {new Date(run.startedAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  {run.message && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {run.message}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                Aucun entraînement enregistré.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prédictions récentes</CardTitle>
          <CardDescription>
            Vue rapide des dernières probabilités calculées par le modèle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {latestRun ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Run</p>
                <p className="text-sm">
                  {latestRun.status} •{" "}
                  {formatDate(latestRun.finishedAt ?? latestRun.startedAt)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Prédictions moyennes par champion
              </p>
              <ScrollArea className="h-[220px]">
                <div className="space-y-3">
                  {status?.championSummary?.map((entry) => (
                    <div
                      key={`champ-${entry.championId}`}
                      className="rounded-lg border border-border/40 bg-background/70 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">
                          {entry.championId}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {entry.sampleCount} samples
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Win probability moyenne :{" "}
                        {(entry.winProbability * 100).toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Top participants (probabilité élevée)
              </p>
              <ScrollArea className="h-[160px]">
                <div className="space-y-2">
                  {status?.matchSamples?.map((entry, index) => (
                    <div
                      key={`match-${entry.matchId}-${entry.participantPUuid}-${index}`}
                      className="rounded border border-border/40 bg-background/60 p-2 text-xs"
                    >
                      <p className="font-semibold">{entry.championId}</p>
                      <p className="text-muted-foreground">
                        Win prob : {(entry.winProbability * 100).toFixed(1)}%
                      </p>
                      <p className="text-muted-foreground">
                        Match : {entry.matchId ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun run n'a encore été exécuté.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

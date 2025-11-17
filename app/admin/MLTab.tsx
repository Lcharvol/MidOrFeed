"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
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
import { ColorBadge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2Icon, DatabaseIcon, BarChart3Icon } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n-context";

type MlStatus = {
  matchesDataset: FileStatus;
  compositionsDataset: FileStatus;
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
  compositionSuggestions: Array<{
    id: string;
    teamChampions: string[];
    enemyChampions: string[];
    role: string;
    confidence: number;
    updatedAt: string;
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

const formatDate = (value?: string, t?: (key: string) => string) => {
  if (!value) return t ? t("admin.ml.never") : "Jamais";
  return new Date(value).toLocaleString("fr-FR");
};

export const MLTab = () => {
  const { t } = useI18n();
  const infoCards = [
    {
      key: "matchesDataset" as const,
      title: t("admin.ml.datasetMatches"),
      description: t("admin.ml.datasetMatchesDesc"),
      icon: DatabaseIcon,
    },
    {
      key: "compositionsDataset" as const,
      title: t("admin.ml.datasetCompositions"),
      description: t("admin.ml.datasetCompositionsDesc"),
      icon: DatabaseIcon,
    },
  ];
  const { data, mutate } = useSWR<{
    success: boolean;
    data: MlStatus;
  }>("/api/admin/ml/status", fetcher, {
    refreshInterval: 15_000,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [lastLogs, setLastLogs] = useState<string | null>(null);
  const [isCompositionExporting, setIsCompositionExporting] = useState(false);
  const [isCompositionTraining, setIsCompositionTraining] = useState(false);
  const [compositionLogs, setCompositionLogs] = useState<string | null>(null);

  const triggerExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/admin/ml/export", { method: "POST" });
      const json = await response.json();
      if (!response.ok || !json.success) {
        toast.error(json.error || t("admin.ml.exportFailed"));
        return;
      }
      toast.success(t("admin.ml.exportComplete").replace("{total}", (json.data?.total ?? "?").toString()));
      await mutate();
    } catch (error) {
      console.error(error);
      toast.error(t("admin.ml.networkError"));
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
        toast.error(json.error || t("admin.ml.trainingFailed"));
        return;
      }
      setLastLogs(json.data?.stdout ?? null);
      toast.success(t("admin.ml.trainingComplete"));
      await mutate();
    } catch (error) {
      console.error(error);
      toast.error(t("admin.ml.errorTraining"));
    } finally {
      setIsTraining(false);
    }
  };

  const triggerCompositionExport = async () => {
    setIsCompositionExporting(true);
    try {
      const response = await fetch("/api/admin/ml/compositions/export", {
        method: "POST",
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        toast.error(json.error || t("admin.ml.compositionExportFailed"));
        return;
      }
      toast.success(t("admin.ml.compositionExportComplete").replace("{total}", (json.data?.total ?? "?").toString()));
      await mutate();
    } catch (error) {
      console.error(error);
      toast.error(t("admin.ml.networkError"));
    } finally {
      setIsCompositionExporting(false);
    }
  };

  const triggerCompositionTraining = async () => {
    setIsCompositionTraining(true);
    setCompositionLogs(null);
    try {
      const response = await fetch("/api/admin/ml/compositions/train", {
        method: "POST",
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        toast.error(json.error || t("admin.ml.compositionPipelineFailed"));
        return;
      }
      setCompositionLogs(json.data?.stdout ?? null);
      toast.success(t("admin.ml.suggestionsUpdated").replace("{count}", (json.data?.totalSuggestions ?? "?").toString()));
      await mutate();
    } catch (error) {
      console.error(error);
      toast.error(t("admin.ml.errorPipelineCompositions"));
    } finally {
      setIsCompositionTraining(false);
    }
  };

  const status = data?.data;
  const latestRun = status?.runs?.[0];
  const compositionSuggestions = useMemo(
    () => status?.compositionSuggestions ?? [],
    [status?.compositionSuggestions]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.ml.pipelineTitle")}</CardTitle>
          <CardDescription>
            {t("admin.ml.pipelineDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground mb-2">
                {t("admin.ml.victoryProbabilityModel")}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={triggerExport} disabled={isExporting} size="sm">
                  {isExporting ? (
                    <>
                      <Loader2Icon className="mr-2 size-4 animate-spin" />
                      {t("admin.ml.exporting")}
                    </>
                  ) : (
                    t("admin.ml.exportMatches")
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
                      {t("admin.ml.training")}
                    </>
                  ) : (
                    t("admin.ml.startTraining")
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      "cd ml && source .venv/bin/activate && pnpm ml:train"
                    );
                    toast.success(t("admin.ml.localCommandCopied"));
                  }}
                >
                  {t("admin.ml.copyLocalCommand")}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase text-muted-foreground mb-2">
                {t("admin.ml.compositionSuggestionsModel")}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={triggerCompositionExport}
                  disabled={isCompositionExporting}
                  size="sm"
                >
                  {isCompositionExporting ? (
                    <>
                      <Loader2Icon className="mr-2 size-4 animate-spin" />
                      {t("admin.ml.exportingCompositions")}
                    </>
                  ) : (
                    t("admin.ml.exportCompositions")
                  )}
                </Button>
                <Button
                  onClick={triggerCompositionTraining}
                  disabled={isCompositionExporting || isCompositionTraining}
                  size="sm"
                  variant="secondary"
                >
                  {isCompositionTraining ? (
                    <>
                      <Loader2Icon className="mr-2 size-4 animate-spin" />
                      {t("admin.ml.generating")}
                    </>
                  ) : (
                    t("admin.ml.updateCompositions")
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      "cd ml && source .venv/bin/activate && pnpm ml:train:compositions"
                    );
                    toast.success(t("admin.ml.localCommandCompositionsCopied"));
                  }}
                >
                  {t("admin.ml.copyLocalCommandCompositions")}
                </Button>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("admin.ml.productionInfo")}
          </p>
          {lastLogs && (
            <div className="rounded-md bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-2">
                {t("admin.ml.lastLogs")}
              </p>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs">
                {lastLogs}
              </pre>
            </div>
          )}
          {compositionLogs && (
            <div className="rounded-md bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-2">
                {t("admin.ml.compositionGenerationLogs")}
              </p>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs">
                {compositionLogs}
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
                    {t("admin.ml.status")}:{" "}
                    <ColorBadge
                      emphasis={fileStatus?.exists ? "positive" : "warning"}
                      variant="subtle"
                      className="px-2.5 py-0.5 text-[0.7rem]"
                    >
                      {fileStatus?.exists ? t("admin.ml.available") : t("admin.ml.missing")}
                    </ColorBadge>
                  </p>
                  <p>{t("admin.ml.size")}: {formatBytes(fileStatus?.size)}</p>
                  <p>{t("admin.ml.updated")}: {formatDate(fileStatus?.updatedAt, t)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        <Card className="border-2 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("admin.ml.latestRuns")}</CardTitle>
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
                {t("admin.ml.noRunsRecorded")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.ml.recentPredictions")}</CardTitle>
          <CardDescription>
            {t("admin.ml.recentPredictionsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {latestRun ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase text-muted-foreground">{t("admin.ml.run")}</p>
                <p className="text-sm">
                  {latestRun.status} •{" "}
                  {formatDate(latestRun.finishedAt ?? latestRun.startedAt, t)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("admin.ml.averagePredictionsByChampion")}
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
                          {entry.sampleCount} {t("admin.ml.samples")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t("admin.ml.averageWinProbability")}:{" "}
                        {(entry.winProbability * 100).toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Separator />
              <p className="text-xs text-muted-foreground">
                {t("admin.ml.topParticipants")}
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
                        {t("admin.ml.winProb")}: {(entry.winProbability * 100).toFixed(1)}%
                      </p>
                      <p className="text-muted-foreground">
                        {t("admin.ml.match")}: {entry.matchId ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("admin.ml.noRunsExecuted")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.ml.aiCompositionSuggestions")}</CardTitle>
          <CardDescription>
            {t("admin.ml.aiCompositionSuggestionsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {compositionSuggestions.length ? (
            <div className="grid gap-3">
              {compositionSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="rounded-lg border border-border/50 bg-background/70 p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">
                      {suggestion.role} • {t("admin.ml.confidence")}{" "}
                      {(suggestion.confidence * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(suggestion.updatedAt, t)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("admin.ml.team")}: {suggestion.teamChampions.join(" · ")}
                  </p>
                  {suggestion.enemyChampions.length ? (
                    <p className="text-xs text-muted-foreground">
                      {t("admin.ml.against")}: {suggestion.enemyChampions.join(" · ")}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("admin.ml.noSuggestionsGenerated")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

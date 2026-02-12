"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChampionIcon } from "@/components/ChampionIcon";
import { StatTile } from "@/components/ui/stat-tile";
import {
  Loader2Icon,
  SearchIcon,
  TrendingUpIcon,
  TargetIcon,
  HomeIcon,
  TrophyIcon,
  SwordsIcon,
  BarChart3Icon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCounterPicks } from "@/lib/hooks/use-counter-picks";
import { CounterPickFilterBar } from "./components/CounterPickFilterBar";
import { CounterPickPodium } from "./components/CounterPickPodium";
import { CounterPickTable } from "./components/CounterPickTable";
import { getChampionSplashUrl } from "@/constants/ddragon";
import { formatPercent, formatNumber } from "./utils";
import { useI18n } from "@/lib/i18n-context";

type CounterPicksPageClientProps = {
  initialChampionId: string;
  initialChampionName?: string | null;
};

const POPULAR_CHAMPIONS = [
  "Yasuo",
  "Zed",
  "Lux",
  "Jinx",
  "LeeSin",
  "Thresh",
  "Ahri",
  "Darius",
];

const CounterPicksPageClient = ({
  initialChampionId,
  initialChampionName = null,
}: CounterPicksPageClientProps) => {
  const router = useRouter();
  const { t } = useI18n();

  const {
    championSummaries,
    championNameMap,
    selectedChampion,
    setSelectedChampion,
    mode,
    setMode,
    counterData,
    pairs,
    summary,
    isLoading,
    error,
  } = useCounterPicks(initialChampionId);

  const championOptions = useMemo(
    () =>
      championSummaries.map((champion) => ({
        id: champion.championId,
        name: champion.name,
      })),
    [championSummaries]
  );

  const selectedChampionName =
    championNameMap.get(selectedChampion) ?? selectedChampion;

  const resolvedChampionName =
    selectedChampionName || initialChampionName || initialChampionId || "";

  const bestCounterName = summary?.bestCounterId
    ? championNameMap.get(summary.bestCounterId) ?? summary.bestCounterId
    : null;

  const handleChampionChange = (championId: string) => {
    setSelectedChampion(championId);
    const targetPath = championId
      ? `/counter-picks/${encodeURIComponent(championId)}`
      : "/counter-picks";
    router.replace(targetPath, { scroll: false });
  };

  const handleQuickSelect = (championId: string) => {
    handleChampionChange(championId);
  };

  // Empty state
  const renderEmptyState = () => (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero placeholder */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-background p-5 sm:p-8 md:p-12">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="mb-2 sm:mb-3 text-xl sm:text-2xl font-bold md:text-3xl">
            {t("counterPicks.findPerfectCounter")}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            {t("counterPicks.selectChampionPrompt")}
          </p>
          {/* Prominent ChampionSelect */}
          <div className="max-w-sm mx-auto">
            <CounterPickFilterBar
              championOptions={championOptions}
              selectedChampion={selectedChampion}
              onChampionChange={handleChampionChange}
              mode={mode}
              onModeChange={setMode}
            />
          </div>
        </div>
      </div>

      {/* Popular champions grid */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <TrendingUpIcon className="size-3.5 sm:size-4" />
          <span>{t("counterPicks.popularChampions")}</span>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3 sm:grid-cols-8">
          {POPULAR_CHAMPIONS.map((champId) => {
            const name = championNameMap.get(champId) ?? champId;
            return (
              <button
                key={champId}
                onClick={() => handleQuickSelect(champId)}
                className="group flex flex-col items-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl border border-border/50 bg-card/50 p-2 sm:p-3 transition-all duration-200 hover:bg-accent/50 hover:ring-2 hover:ring-primary/20"
              >
                <ChampionIcon
                  championId={champId}
                  size={36}
                  shape="circle"
                  className="sm:w-12 sm:h-12 border border-border/50 transition-transform duration-200 group-hover:scale-105"
                />
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground truncate max-w-full">
                  {name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!selectedChampion) {
      return renderEmptyState();
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative rounded-full bg-muted p-4">
              <Loader2Icon className="size-8 animate-spin text-primary" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-medium">{t("counterPicks.loading")}</p>
            <p className="text-sm text-muted-foreground">
              {t("counterPicks.loadingDescription").replace("{championName}", resolvedChampionName)}
            </p>
          </div>
        </div>
      );
    }

    if (error || !counterData) {
      const statusCode = error && typeof error === "object" && "status" in error ? (error as { status: number }).status : null;
      const errorMessage =
        statusCode === 404
          ? t("counterPicks.errorNotFound").replace("{championName}", resolvedChampionName)
          : statusCode === 429
            ? t("counterPicks.errorRateLimit")
            : typeof error === "string"
              ? error
              : t("counterPicks.errorGeneric").replace("{championName}", resolvedChampionName);

      return (
        <Card className="border-danger/30 bg-danger-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-danger-muted-foreground">
              <TargetIcon className="size-5" />
              {t("counterPicks.errorLoading")}
            </CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
        </Card>
      );
    }

    if (!summary || pairs.length === 0) {
      return (
        <Card className="border-warning/30 bg-warning-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning-muted-foreground">
              <SearchIcon className="size-5" />
              {t("counterPicks.insufficientData")}
            </CardTitle>
            <CardDescription>
              {t("counterPicks.insufficientDataDescription").replace("{championName}", resolvedChampionName)}
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Stats tiles */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            label={t("counterPicks.overallWinRate")}
            value={formatPercent(summary.overallWinRate)}
            hint={`${formatNumber(summary.championWins)} V / ${formatNumber(summary.championLosses)} D`}
            icon={<BarChart3Icon className="size-5" />}
            emphasis={summary.overallWinRate >= 0.5 ? "positive" : "danger"}
          />
          <StatTile
            label={t("counterPicks.bestCounter")}
            value={
              bestCounterName ? (
                <span className="flex items-center gap-2">
                  <ChampionIcon
                    championId={summary.bestCounterId!}
                    size={28}
                    shape="circle"
                    className="border border-success/30"
                  />
                  {bestCounterName}
                </span>
              ) : (
                "—"
              )
            }
            hint={
              bestCounterName
                ? `${formatPercent(summary.bestCounterWinRate)} · ${formatNumber(summary.bestCounterGames)} ${t("counterPicks.matches").toLowerCase()}`
                : undefined
            }
            icon={<TrophyIcon className="size-5" />}
            emphasis="positive"
          />
          <StatTile
            label={t("counterPicks.reliableMatchups")}
            value={summary.reliableMatchups}
            hint={t("counterPicks.matchesAnalyzed").replace("{count}", formatNumber(summary.gamesAnalysed))}
            icon={<SwordsIcon className="size-5" />}
            emphasis="info"
          />
        </div>

        {/* Podium */}
        <CounterPickPodium
          pairs={pairs}
          championNameMap={championNameMap}
        />

        {/* Table */}
        <CounterPickTable
          championName={resolvedChampionName}
          pairs={pairs}
          championNameMap={championNameMap}
          mode={mode}
        />
      </div>
    );
  };

  return (
    <main className="container mx-auto px-4 py-8 sm:py-10">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/"><HomeIcon className="size-4" /></Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("counterPicks.title")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero Section when champion is selected */}
      {selectedChampion && (
        <div className="relative mb-6 sm:mb-8 overflow-hidden rounded-xl sm:rounded-2xl">
          {/* Background splash */}
          <div className="absolute inset-0">
            <Image
              src={getChampionSplashUrl(selectedChampion)}
              alt=""
              fill
              className="object-cover object-top"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/70" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-10 md:px-10 md:py-14">
            <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex items-center gap-3 sm:gap-5">
                <ChampionIcon
                  championId={selectedChampion}
                  size={64}
                  shape="rounded"
                  className="sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl border-2 border-white/20 shadow-2xl"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5 sm:mb-2">
                    <Badge variant="outline" className="border-primary/50 text-primary text-[10px] sm:text-xs">
                      <TargetIcon className="mr-1 size-2.5 sm:size-3" />
                      {t("counterPicks.title")}
                    </Badge>
                    <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-[10px] sm:text-xs">
                      {mode === "same_lane" ? t("counterPicks.sameLane") : t("counterPicks.global")}
                    </Badge>
                  </div>
                  <h1 className="text-xl sm:text-3xl font-bold tracking-tight md:text-4xl">
                    {t("counterPicks.counterTitle").replace("{championName}", resolvedChampionName)}
                  </h1>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">
                    {t("counterPicks.counterDescription")}
                  </p>
                </div>
              </div>

              {/* Quick stats in hero */}
              {summary && (
                <div className="flex gap-4 sm:gap-6">
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold">
                      {formatPercent(summary.overallWinRate)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {t("counterPicks.winRate")}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold">{summary.reliableMatchups}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Matchups</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-2xl font-bold">{formatNumber(summary.totalMatches)}</p>
                    <p className="text-xs text-muted-foreground">{t("counterPicks.matches")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page header when no champion selected */}
      {!selectedChampion && (
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t("counterPicks.title")}
          </h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">
            {t("counterPicks.description")}
          </p>
        </div>
      )}

      {/* Filter bar (only when champion is selected) */}
      {selectedChampion && (
        <div className="mb-6">
          <CounterPickFilterBar
            championOptions={championOptions}
            selectedChampion={selectedChampion}
            onChampionChange={handleChampionChange}
            mode={mode}
            onModeChange={setMode}
          />
        </div>
      )}

      {/* Main content — full width */}
      <div>{renderContent()}</div>
    </main>
  );
};

export default CounterPicksPageClient;

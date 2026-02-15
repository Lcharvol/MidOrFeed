"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { ChampionIcon } from "@/components/ChampionIcon";
import {
  Loader2Icon,
  SearchIcon,
  TrendingUpIcon,
  TargetIcon,
  HomeIcon,
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
import { CounterPickTable } from "./components/CounterPickTable";
import { CounterPickPodium } from "./components/CounterPickPodium";
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

  const handleChampionChange = (championId: string) => {
    setSelectedChampion(championId);
    const targetPath = championId
      ? `/counter-picks/${encodeURIComponent(championId)}`
      : "/counter-picks";
    router.replace(targetPath, { scroll: false });
  };

  // Empty state — popular champions grid only (filter is in PageHero)
  const renderEmptyState = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <TrendingUpIcon className="size-3.5" />
        <span>{t("counterPicks.popularChampions")}</span>
      </div>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {POPULAR_CHAMPIONS.map((champId) => {
          const name = championNameMap.get(champId) ?? champId;
          return (
            <button
              key={champId}
              onClick={() => handleChampionChange(champId)}
              className="group flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all hover:bg-muted/50"
            >
              <ChampionIcon
                championId={champId}
                size={48}
                shape="circle"
                className="transition-transform group-hover:scale-105"
              />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground truncate max-w-full">
                {name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderContent = () => {
    if (!selectedChampion) {
      return renderEmptyState();
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative rounded-full bg-muted p-3">
              <Loader2Icon className="size-6 animate-spin text-primary" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">{t("counterPicks.loading")}</p>
            <p className="text-xs text-muted-foreground">
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
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-sm text-danger-muted-foreground">
              <TargetIcon className="size-4" />
              {t("counterPicks.errorLoading")}
            </CardTitle>
            <CardDescription className="text-xs">{errorMessage}</CardDescription>
          </CardHeader>
        </Card>
      );
    }

    if (!summary || pairs.length === 0) {
      return (
        <Card className="border-warning/30 bg-warning-muted/50">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-sm text-warning-muted-foreground">
              <SearchIcon className="size-4" />
              {t("counterPicks.insufficientData")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("counterPicks.insufficientDataDescription").replace("{championName}", resolvedChampionName)}
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        <CounterPickPodium pairs={pairs} championNameMap={championNameMap} />
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
    <main className="container mx-auto px-4 py-6 sm:py-10 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/"><HomeIcon className="size-4" /></Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {selectedChampion ? (
              <BreadcrumbLink asChild><Link href="/counter-picks">{t("counterPicks.title")}</Link></BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{t("counterPicks.title")}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {selectedChampion && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{resolvedChampionName}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero with splash when champion is selected */}
      {selectedChampion && (
        <div className="relative overflow-hidden rounded-xl">
          {/* Background splash */}
          <div className="absolute inset-0">
            <Image
              src={getChampionSplashUrl(selectedChampion)}
              alt={`${selectedChampion} splash art`}
              fill
              className="object-cover object-top"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/70" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          <div className="relative z-10 px-5 py-5 sm:px-6 sm:py-6 space-y-4">
            {/* Title row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <ChampionIcon
                  championId={selectedChampion}
                  size={48}
                  shape="rounded"
                  className="sm:w-14 sm:h-14 rounded-lg border-2 border-white/20 shadow-lg"
                />
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
                    {t("counterPicks.counterTitle").replace("{championName}", resolvedChampionName)}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("counterPicks.counterDescription")}
                  </p>
                </div>
              </div>

              {/* Quick stats — label/value blocks with vertical dividers */}
              {summary && (
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm sm:text-base font-bold tabular-nums">
                      {formatPercent(summary.overallWinRate)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {t("counterPicks.overallWinRate")}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-border/50" />
                  <div className="text-center">
                    <p className="text-sm sm:text-base font-bold tabular-nums">
                      {summary.reliableMatchups}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {t("counterPicks.reliableMatchups")}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-border/50 hidden sm:block" />
                  <div className="text-center hidden sm:block">
                    <p className="text-sm sm:text-base font-bold tabular-nums">
                      {formatNumber(summary.gamesAnalysed)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {t("counterPicks.matches")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Page header with integrated filter when no champion selected */}
      {!selectedChampion && (
        <PageHero
          title={t("counterPicks.title")}
          description={t("counterPicks.description")}
        >
          <div className="w-full max-w-sm space-y-3">
            <CounterPickFilterBar
              championOptions={championOptions}
              selectedChampion={selectedChampion}
              onChampionChange={handleChampionChange}
              mode={mode}
              onModeChange={setMode}
            />
          </div>
        </PageHero>
      )}

      {/* Filter bar — always rendered as separate section when champion selected */}
      {selectedChampion && (
        <CounterPickFilterBar
          championOptions={championOptions}
          selectedChampion={selectedChampion}
          onChampionChange={handleChampionChange}
          mode={mode}
          onModeChange={setMode}
        />
      )}

      {renderContent()}
    </main>
  );
};

export default CounterPicksPageClient;

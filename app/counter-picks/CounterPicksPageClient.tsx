"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChampionSelect } from "@/components/ChampionSelect";
import { ChampionIcon } from "@/components/ChampionIcon";
import {
  Loader2Icon,
  SearchIcon,
  TrendingUpIcon,
  ShieldIcon,
  SwordsIcon,
  TargetIcon,
  SparklesIcon,
  GlobeIcon,
  UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCounterPicks } from "@/lib/hooks/use-counter-picks";
import { CounterPickSummaryCard } from "./components/CounterPickSummaryCard";
import { CounterPickTips } from "./components/CounterPickTips";
import { CounterPickTable } from "./components/CounterPickTable";
import { getChampionSplashUrl } from "@/constants/ddragon";
import { cn } from "@/lib/utils";
import type { CounterPickMode } from "@/types";

type CounterPicksPageClientProps = {
  initialChampionId: string;
  initialChampionName?: string | null;
};

// Popular champions to show when no champion is selected
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
    tips,
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

  const handleQuickSelect = (championId: string) => {
    handleChampionChange(championId);
  };

  // Empty state with popular champions
  const renderEmptyState = () => (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero placeholder */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-5 sm:p-8 md:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-primary),transparent_70%)] opacity-10" />
        <div className="relative z-10 max-w-2xl">
          <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 sm:px-3 py-1 text-xs sm:text-sm text-primary">
            <TargetIcon className="size-3 sm:size-4" />
            Analysez vos matchups
          </div>
          <h2 className="mb-2 sm:mb-3 text-xl sm:text-2xl font-bold md:text-3xl">
            Trouvez le counter parfait
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Sélectionnez un champion ennemi pour découvrir les meilleurs counter
            picks.
          </p>
        </div>
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Popular champions grid */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <TrendingUpIcon className="size-3.5 sm:size-4" />
          <span>Champions populaires</span>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3 sm:grid-cols-8">
          {POPULAR_CHAMPIONS.map((champId) => {
            const name = championNameMap.get(champId) ?? champId;
            return (
              <button
                key={champId}
                onClick={() => handleQuickSelect(champId)}
                className="group flex flex-col items-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl border border-border/50 bg-card/50 p-2 sm:p-3 transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <ChampionIcon
                  championId={champId}
                  size={36}
                  shape="circle"
                  className="sm:w-12 sm:h-12 border-2 border-border/50 transition-all group-hover:border-primary/50 group-hover:scale-105"
                />
                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground truncate max-w-full">
                  {name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Features */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-start gap-4 p-4">
            <div className="rounded-lg bg-success-muted p-2">
              <ShieldIcon className="size-5 text-success-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Win rates précis</h3>
              <p className="text-sm text-muted-foreground">
                Statistiques basées sur des matchs réels
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-start gap-4 p-4">
            <div className="rounded-lg bg-info-muted p-2">
              <SwordsIcon className="size-5 text-info-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Matchups détaillés</h3>
              <p className="text-sm text-muted-foreground">
                Analyse approfondie de chaque affrontement
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-start gap-4 p-4">
            <div className="rounded-lg bg-warning-muted p-2">
              <SparklesIcon className="size-5 text-warning-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Conseils stratégiques</h3>
              <p className="text-sm text-muted-foreground">
                Tips pour exploiter chaque matchup
              </p>
            </div>
          </CardContent>
        </Card>
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
            <div className="relative rounded-full bg-primary/10 p-4">
              <Loader2Icon className="size-8 animate-spin text-primary" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-medium">Analyse en cours...</p>
            <p className="text-sm text-muted-foreground">
              Récupération des counter picks pour {resolvedChampionName}
            </p>
          </div>
        </div>
      );
    }

    if (error || !counterData) {
      return (
        <Card className="border-danger/30 bg-danger-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-danger-muted-foreground">
              <TargetIcon className="size-5" />
              Erreur de chargement
            </CardTitle>
            <CardDescription>
              Impossible de récupérer les counter picks pour {resolvedChampionName}.
              Réessayez dans quelques instants.
            </CardDescription>
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
              Données insuffisantes
            </CardTitle>
            <CardDescription>
              Pas assez de matchs analysés pour {resolvedChampionName}. Les données
              seront disponibles après plus de parties.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        <CounterPickSummaryCard
          championId={selectedChampion}
          championName={resolvedChampionName}
          championNameMap={championNameMap}
          summary={summary}
        />

        {tips.length > 0 && (
          <CounterPickTips championName={resolvedChampionName} tips={tips} />
        )}

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
    <main className="container mx-auto px-4 py-6 sm:py-8">
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
                  size={56}
                  shape="rounded"
                  className="sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl border-2 border-white/20 shadow-2xl"
                />
                <div>
                  <Badge variant="outline" className="mb-1.5 sm:mb-2 border-primary/50 text-primary text-[10px] sm:text-xs">
                    <TargetIcon className="mr-1 size-2.5 sm:size-3" />
                    Counter picks
                  </Badge>
                  <h1 className="text-xl sm:text-3xl font-bold tracking-tight md:text-4xl">
                    Contrer {resolvedChampionName}
                  </h1>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">
                    Les meilleurs champions pour ce matchup
                  </p>
                </div>
              </div>

              {/* Quick stats */}
              {summary && (
                <div className="flex gap-4 sm:gap-6">
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold">
                      {(summary.overallWinRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Win rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold">{summary.reliableMatchups}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Matchups</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-2xl font-bold">{summary.totalMatches}</p>
                    <p className="text-xs text-muted-foreground">Matchs</p>
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Counter picks</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">
            Trouvez les meilleurs champions pour contrer vos adversaires.
          </p>
        </div>
      )}

      {/* Main layout */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="space-y-4 order-first lg:order-none">
          <Card className="lg:sticky lg:top-4 border-border/50">
            <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <SearchIcon className="size-3.5 sm:size-4 text-muted-foreground" />
                Champion à contrer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
              <ChampionSelect
                options={championOptions}
                value={selectedChampion || null}
                onChange={handleChampionChange}
                placeholder="Rechercher..."
              />

              {/* Mode toggle */}
              <div className="space-y-2">
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                  Type de matchup
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMode("same_lane")}
                    className={cn(
                      "flex flex-col items-center gap-1 sm:gap-1.5 rounded-lg border p-2 sm:p-3 text-[10px] sm:text-xs transition-all",
                      mode === "same_lane"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 hover:border-border hover:bg-muted/50"
                    )}
                  >
                    <UserIcon className="size-3.5 sm:size-4" />
                    <span className="font-medium">Même lane</span>
                  </button>
                  <button
                    onClick={() => setMode("global")}
                    className={cn(
                      "flex flex-col items-center gap-1 sm:gap-1.5 rounded-lg border p-2 sm:p-3 text-[10px] sm:text-xs transition-all",
                      mode === "global"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 hover:border-border hover:bg-muted/50"
                    )}
                  >
                    <GlobeIcon className="size-3.5 sm:size-4" />
                    <span className="font-medium">Global</span>
                  </button>
                </div>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                  {mode === "same_lane"
                    ? "Face à face en lane"
                    : "Toutes lanes"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick access to popular champions */}
          {selectedChampion && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">
                  Autres populaires
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-2">
                {POPULAR_CHAMPIONS.filter((c) => c !== selectedChampion)
                  .slice(0, 4)
                  .map((champId) => (
                    <button
                      key={champId}
                      onClick={() => handleQuickSelect(champId)}
                      className="flex flex-col items-center gap-1 rounded-lg p-2 transition-colors hover:bg-muted"
                    >
                      <ChampionIcon
                        championId={champId}
                        size={32}
                        shape="circle"
                        className="border border-border/50"
                      />
                    </button>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main content */}
        <div>{renderContent()}</div>
      </div>
    </main>
  );
};

export default CounterPicksPageClient;

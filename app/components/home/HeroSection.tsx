"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  BrainIcon,
  UsersIcon,
  BarChart3Icon,
  GamepadIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { SummonerSearchBar } from "@/components/SummonerSearchBar";
import { PublicStats, formatNumber } from "./types";

type HeroSectionProps = {
  stats: PublicStats | undefined;
  statsLoading: boolean;
};

export const HeroSection = ({ stats, statsLoading }: HeroSectionProps) => {
  const { t } = useI18n();

  return (
    <section className="relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 overflow-hidden border-b py-20 md:py-28">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/home_background.png"
          alt="League of Legends Background"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-4" variant="secondary">
            <BrainIcon className="mr-2 size-3" />
            {t("home.poweredByAI")}
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-6xl animate-fade-up">
            {t("home.aiCoach")}{" "}
            <span className="text-primary">
              {t("home.dominateRift")}
            </span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
            {t("home.subtitle")}
          </p>

          <div className="w-full max-w-xl mx-auto mb-10">
            <SummonerSearchBar />
            <p className="text-xs text-muted-foreground/60 mt-2 text-center">
              {t("homeSearch.hint") || "Search for a summoner to view their stats, matches and more"}
            </p>
          </div>

          {/* Live Stats with Tooltips */}
          <div className="grid grid-cols-3 gap-6 md:gap-10 max-w-2xl mx-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center cursor-default">
                  <div className="mb-1 text-2xl md:text-3xl font-bold text-primary">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16 mx-auto" />
                    ) : (
                      formatNumber(stats?.totalMatches ?? 0)
                    )}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <BarChart3Icon className="size-3 hidden sm:inline" />
                    {t("home.matchesAnalyzed")}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent sideOffset={4}>
                {stats?.totalMatches?.toLocaleString() ?? "0"} parties analysees au total
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center cursor-default">
                  <div className="mb-1 text-2xl md:text-3xl font-bold text-primary">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16 mx-auto" />
                    ) : (
                      formatNumber(stats?.totalPlayers ?? 0)
                    )}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <UsersIcon className="size-3 hidden sm:inline" />
                    {t("home.playersCoached")}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent sideOffset={4}>
                {stats?.totalPlayers?.toLocaleString() ?? "0"} joueurs suivis
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center cursor-default">
                  <div className="mb-1 text-2xl md:text-3xl font-bold text-primary">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16 mx-auto" />
                    ) : (
                      stats?.totalChampions ?? 0
                    )}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <GamepadIcon className="size-3 hidden sm:inline" />
                    {t("homeStats.champions") ?? "Champions"}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent sideOffset={4}>
                Champions uniques dans la base de donnees
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </section>
  );
};

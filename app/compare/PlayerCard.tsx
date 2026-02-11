"use client";

import { SkeletonAvatar } from "@/components/ui/skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UsersIcon } from "lucide-react";
import { getProfileIconUrl } from "@/constants/ddragon";
import { TIER_COLORS } from "./types";
import type { RankedInfo, PlayerData } from "./types";

const REGION_EMPHASIS: Record<string, "info" | "positive" | "warning" | "neutral"> = {
  euw1: "info",
  eun1: "info",
  na1: "positive",
  kr: "warning",
  br1: "positive",
  la1: "neutral",
  la2: "neutral",
  oc1: "neutral",
  tr1: "warning",
  ru: "info",
  jp1: "neutral",
};

export const RankBadge = ({ rankedInfo }: { rankedInfo: RankedInfo | null }) => {
  if (!rankedInfo) {
    return (
      <Badge variant="secondary" className="text-xs">
        Non classe
      </Badge>
    );
  }

  const tierColor = TIER_COLORS[rankedInfo.tier] || "bg-gray-500";

  return (
    <div className="flex flex-col items-center gap-1">
      <Badge className={`${tierColor} text-white text-xs font-bold`}>
        {rankedInfo.tier} {rankedInfo.rank}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {rankedInfo.leaguePoints} LP
      </span>
      <span className="text-xs text-muted-foreground">
        {rankedInfo.wins}V / {rankedInfo.losses}D ({rankedInfo.winRate.toFixed(0)}%)
      </span>
    </div>
  );
};

export const PlayerCard = ({
  player,
  loading,
}: {
  player: PlayerData | null;
  loading: boolean;
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2 sm:gap-3">
        <SkeletonAvatar size="lg" className="size-16 sm:size-24" />
        <Skeleton className="h-5 sm:h-6 w-24 sm:w-36" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 sm:h-6 w-24 sm:w-32" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center gap-2 sm:gap-3 text-muted-foreground py-2 sm:py-4">
        <div className="size-16 sm:size-24 rounded-full bg-muted/50 flex items-center justify-center border-2 border-dashed border-border">
          <UsersIcon className="size-6 sm:size-10 text-muted-foreground/50" />
        </div>
        <span className="text-xs sm:text-sm text-center">Selectionnez un joueur</span>
      </div>
    );
  }

  const regionEmphasis = REGION_EMPHASIS[player.region.toLowerCase()] ?? "neutral";

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div className="relative">
        <Avatar className="size-16 sm:size-24 border-2 border-primary/30 shadow-lg">
          {player.profileIconId != null && (
            <AvatarImage src={getProfileIconUrl(player.profileIconId)} alt={player.gameName} />
          )}
          <AvatarFallback className="text-xl sm:text-3xl bg-muted">
            {player.gameName[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {player.summonerLevel != null && (
          <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-bold rounded-full size-5 sm:size-7 flex items-center justify-center border-2 border-background">
            {player.summonerLevel}
          </span>
        )}
      </div>
      <div className="text-center">
        <div className="text-sm sm:text-lg font-semibold">
          <span className="truncate max-w-[80px] sm:max-w-none inline-block align-bottom">{player.gameName}</span>
          <span className="text-muted-foreground font-normal text-xs sm:text-base">
            #{player.tagLine}
          </span>
        </div>
        <div className="mt-1">
          <Badge emphasis={regionEmphasis} emphasisVariant="subtle" rounded="full" className="text-[10px] sm:text-xs">
            {player.region.toUpperCase()}
          </Badge>
        </div>
      </div>
      <RankBadge rankedInfo={player.rankedInfo} />
      {player.recentForm.streakType && (
        <Badge variant={player.recentForm.streakType === "win" ? "default" : "secondary"} className="text-xs">
          {player.recentForm.streakType === "win" ? "🔥" : "❄️"} {player.recentForm.currentStreak} {player.recentForm.streakType === "win" ? "victoires" : "defaites"}
        </Badge>
      )}
    </div>
  );
};

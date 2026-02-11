"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UsersIcon } from "lucide-react";
import { DDRAGON_VERSION } from "@/constants/ddragon";
import { TIER_COLORS } from "./types";
import type { RankedInfo, PlayerData } from "./types";

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
        <Skeleton className="size-16 sm:size-24 rounded-full" />
        <Skeleton className="h-5 sm:h-6 w-24 sm:w-36" />
        <Skeleton className="h-4 sm:h-5 w-20 sm:w-28" />
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

  const iconUrl = player.profileIconId
    ? `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${player.profileIconId}.png`
    : null;

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <Avatar className="size-16 sm:size-24 border-2 border-primary/30 shadow-lg">
        {iconUrl ? (
          <AvatarImage src={iconUrl} alt={player.gameName} />
        ) : null}
        <AvatarFallback className="text-xl sm:text-3xl bg-muted">
          {player.gameName[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="text-center">
        <div className="text-sm sm:text-lg font-semibold">
          <span className="truncate max-w-[80px] sm:max-w-none inline-block align-bottom">{player.gameName}</span>
          <span className="text-muted-foreground font-normal text-xs sm:text-base">
            #{player.tagLine}
          </span>
        </div>
        <div className="text-[10px] sm:text-sm text-muted-foreground">
          {player.region.toUpperCase()} - Niv.{" "}
          {player.summonerLevel || "?"}
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

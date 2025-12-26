"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionIcon } from "@/components/ChampionIcon";
import {
  RadioIcon,
  ClockIcon,
  SwordsIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useApiSWR } from "@/lib/hooks/swr";
import { useChampions } from "@/lib/hooks/use-champions";
import { cn } from "@/lib/utils";

interface LiveGameBannerProps {
  puuid: string;
  region: string | null;
}

type Participant = {
  puuid: string;
  riotId: string;
  teamId: number;
  championId: number;
  spell1Id: number;
  spell2Id: number;
  isCurrentPlayer: boolean;
};

type BannedChampion = {
  championId: number;
  teamId: number;
};

type LiveGameResponse = {
  success: boolean;
  inGame: boolean;
  data: {
    gameId: number;
    gameMode: string;
    gameType: string;
    gameLength: number;
    gameStartTime: string;
    mapId: number;
    queueId: number;
    participants: Participant[];
    bannedChampions: BannedChampion[];
    observerKey: string;
  } | null;
};

const formatGameTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export function LiveGameBanner({ puuid, region }: LiveGameBannerProps) {
  const { championKeyToIdMap, resolveName } = useChampions();
  const [expanded, setExpanded] = useState(false);
  const [gameTime, setGameTime] = useState(0);

  const { data, isLoading, mutate } = useApiSWR<LiveGameResponse>(
    puuid && region ? `/api/summoners/${puuid}/live-game?region=${region}` : null,
    {
      revalidateOnFocus: true,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  // Update game time every second when in game
  useEffect(() => {
    if (!data?.inGame || !data?.data?.gameStartTime) return;

    const startTime = new Date(data.data.gameStartTime).getTime();
    const initialLength = data.data.gameLength;

    const updateTime = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setGameTime(Math.max(0, elapsed));
    };

    // Set initial time
    if (initialLength > 0) {
      setGameTime(initialLength);
    } else {
      updateTime();
    }

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [data?.inGame, data?.data?.gameStartTime, data?.data?.gameLength]);

  const { blueTeam, redTeam, currentPlayer, blueBans, redBans } = useMemo(() => {
    if (!data?.data?.participants) {
      return { blueTeam: [], redTeam: [], currentPlayer: null, blueBans: [], redBans: [] };
    }

    const blue = data.data.participants.filter((p) => p.teamId === 100);
    const red = data.data.participants.filter((p) => p.teamId === 200);
    const current = data.data.participants.find((p) => p.isCurrentPlayer) || null;
    const bBans = data.data.bannedChampions.filter((b) => b.teamId === 100);
    const rBans = data.data.bannedChampions.filter((b) => b.teamId === 200);

    return { blueTeam: blue, redTeam: red, currentPlayer: current, blueBans: bBans, redBans: rBans };
  }, [data?.data?.participants, data?.data?.bannedChampions]);

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.inGame || !data?.data) {
    return null;
  }

  const game = data.data;

  return (
    <Card className="border-green-500/30 bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent overflow-hidden">
      <CardContent className="py-3">
        {/* Main banner */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <RadioIcon className="size-5 text-green-500 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 size-2 bg-green-500 rounded-full animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-600 dark:text-green-400">
                  En partie
                </span>
                <Badge variant="secondary" className="text-xs">
                  {game.gameType}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ClockIcon className="size-3" />
                <span>{formatGameTime(gameTime)}</span>
                {currentPlayer && (
                  <>
                    <span className="text-muted-foreground/50">|</span>
                    <span className="flex items-center gap-1">
                      <ChampionIcon
                        championId={championKeyToIdMap.get(String(currentPlayer.championId)) || String(currentPlayer.championId)}
                        size={16}
                        className="rounded"
                      />
                      {resolveName(String(currentPlayer.championId))}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => mutate()}
              className="h-8 px-2"
            >
              <RefreshCwIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 px-2"
            >
              {expanded ? (
                <ChevronUpIcon className="size-4" />
              ) : (
                <ChevronDownIcon className="size-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expanded view */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="grid grid-cols-2 gap-4">
              {/* Blue team */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30">
                    Equipe Bleue
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {blueTeam.map((p) => {
                    const champSlug = championKeyToIdMap.get(String(p.championId)) || String(p.championId);
                    return (
                      <div
                        key={p.puuid}
                        className={cn(
                          "flex items-center gap-2 p-1.5 rounded-md",
                          p.isCurrentPlayer && "bg-primary/10 ring-1 ring-primary/30"
                        )}
                      >
                        <ChampionIcon
                          championId={champSlug}
                          size={28}
                          className="rounded"
                        />
                        <span className="text-sm truncate flex-1">
                          {p.riotId || resolveName(String(p.championId))}
                        </span>
                        {p.isCurrentPlayer && (
                          <Badge variant="outline" className="text-[10px] px-1">
                            Vous
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
                {blueBans.length > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground mr-1">Bans:</span>
                    {blueBans.map((b, i) => (
                      <ChampionIcon
                        key={i}
                        championId={championKeyToIdMap.get(String(b.championId)) || String(b.championId)}
                        size={20}
                        className="rounded opacity-50 grayscale"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Red team */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30">
                    Equipe Rouge
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {redTeam.map((p) => {
                    const champSlug = championKeyToIdMap.get(String(p.championId)) || String(p.championId);
                    return (
                      <div
                        key={p.puuid}
                        className={cn(
                          "flex items-center gap-2 p-1.5 rounded-md",
                          p.isCurrentPlayer && "bg-primary/10 ring-1 ring-primary/30"
                        )}
                      >
                        <ChampionIcon
                          championId={champSlug}
                          size={28}
                          className="rounded"
                        />
                        <span className="text-sm truncate flex-1">
                          {p.riotId || resolveName(String(p.championId))}
                        </span>
                        {p.isCurrentPlayer && (
                          <Badge variant="outline" className="text-[10px] px-1">
                            Vous
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
                {redBans.length > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground mr-1">Bans:</span>
                    {redBans.map((b, i) => (
                      <ChampionIcon
                        key={i}
                        championId={championKeyToIdMap.get(String(b.championId)) || String(b.championId)}
                        size={20}
                        className="rounded opacity-50 grayscale"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

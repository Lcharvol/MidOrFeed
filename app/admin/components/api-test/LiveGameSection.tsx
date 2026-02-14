"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChampionIcon } from "@/components/ChampionIcon";
import {
  RadioIcon,
  Loader2Icon,
  RefreshCwIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useChampions } from "@/lib/hooks/use-champions";
import { authenticatedFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { LiveGameData } from "./types";

interface LiveGameSectionProps {
  region: string;
  puuid: string;
}

export const LiveGameSection = ({ region, puuid }: LiveGameSectionProps) => {
  const { championKeyToIdMap, resolveName } = useChampions();

  const [liveGameLoading, setLiveGameLoading] = useState(false);
  const [liveGameData, setLiveGameData] = useState<LiveGameData | null>(null);
  const [liveGameError, setLiveGameError] = useState<string | null>(null);

  const testLiveGame = async () => {
    if (!puuid) {
      toast.error("PUUID requis");
      return;
    }

    setLiveGameLoading(true);
    setLiveGameError(null);
    try {
      const res = await authenticatedFetch(
        `/api/summoners/${puuid}/live-game?region=${region}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur API");
      }

      setLiveGameData(data);
      toast.success(data.inGame ? "Joueur en partie!" : "Joueur pas en partie");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setLiveGameError(message);
      toast.error(message);
    } finally {
      setLiveGameLoading(false);
    }
  };

  const formatGameTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RadioIcon className="size-5 text-green-500" />
              Live Game (spectator-v5)
            </CardTitle>
            <CardDescription>
              Teste si le joueur est actuellement en partie
            </CardDescription>
          </div>
          <Button onClick={testLiveGame} disabled={liveGameLoading || !puuid}>
            {liveGameLoading ? (
              <Loader2Icon className="size-4 animate-spin mr-2" />
            ) : (
              <RefreshCwIcon className="size-4 mr-2" />
            )}
            Tester
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {liveGameError && (
          <div className="flex items-center gap-2 text-destructive mb-4">
            <XCircleIcon className="size-4" />
            <span className="text-sm">{liveGameError}</span>
          </div>
        )}

        {liveGameData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {liveGameData.inGame ? (
                <>
                  <CheckCircleIcon className="size-5 text-green-500" />
                  <span className="font-medium text-green-600">En partie</span>
                </>
              ) : (
                <>
                  <XCircleIcon className="size-5 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">Pas en partie</span>
                </>
              )}
            </div>

            {liveGameData.inGame && liveGameData.data && (
              <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-4 text-sm">
                  <Badge>{liveGameData.data.gameType}</Badge>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <ClockIcon className="size-3" />
                    {formatGameTime(liveGameData.data.gameLength)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Blue Team */}
                  <div>
                    <Badge className="mb-2 bg-blue-500/20 text-blue-600 border-blue-500/30">
                      Equipe Bleue
                    </Badge>
                    <div className="space-y-1">
                      {liveGameData.data.participants
                        .filter((p) => p.teamId === 100)
                        .map((p) => {
                          const champSlug = championKeyToIdMap.get(String(p.championId)) || String(p.championId);
                          return (
                            <div
                              key={p.puuid}
                              className={cn(
                                "flex items-center gap-2 p-1 rounded text-sm",
                                p.isCurrentPlayer && "bg-primary/10"
                              )}
                            >
                              <ChampionIcon championId={champSlug} size={24} className="rounded" />
                              <span className="truncate">{p.riotId || resolveName(String(p.championId))}</span>
                              {p.isCurrentPlayer && <Badge variant="outline" className="text-[10px]">Vous</Badge>}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Red Team */}
                  <div>
                    <Badge className="mb-2 bg-red-500/20 text-red-600 border-red-500/30">
                      Equipe Rouge
                    </Badge>
                    <div className="space-y-1">
                      {liveGameData.data.participants
                        .filter((p) => p.teamId === 200)
                        .map((p) => {
                          const champSlug = championKeyToIdMap.get(String(p.championId)) || String(p.championId);
                          return (
                            <div
                              key={p.puuid}
                              className={cn(
                                "flex items-center gap-2 p-1 rounded text-sm",
                                p.isCurrentPlayer && "bg-primary/10"
                              )}
                            >
                              <ChampionIcon championId={champSlug} size={24} className="rounded" />
                              <span className="truncate">{p.riotId || resolveName(String(p.championId))}</span>
                              {p.isCurrentPlayer && <Badge variant="outline" className="text-[10px]">Vous</Badge>}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!liveGameData && !liveGameError && !liveGameLoading && (
          <div className="text-sm text-muted-foreground">
            Cliquez sur Tester pour verifier si le joueur est en partie
          </div>
        )}
      </CardContent>
    </Card>
  );
};

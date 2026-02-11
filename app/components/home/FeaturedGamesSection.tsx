"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonAvatar } from "@/components/ui/skeleton";
import { ChampionIcon } from "@/components/ChampionIcon";
import { EyeIcon } from "lucide-react";
import { FeaturedGame } from "./types";

type FeaturedGamesSectionProps = {
  featuredGames: FeaturedGame[];
  featuredLoading: boolean;
  championKeyToIdMap: Map<string, string>;
};

export const FeaturedGamesSection = ({
  featuredGames,
  featuredLoading,
  championKeyToIdMap,
}: FeaturedGamesSectionProps) => {
  if (featuredGames.length === 0 && !featuredLoading) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
              <EyeIcon className="size-6 text-primary" />
              Parties en direct
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Parties ranked en cours sur EUW
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featuredLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex justify-between">
                      <div className="flex gap-1">{Array.from({ length: 5 }).map((_, j) => <SkeletonAvatar key={j} size="sm" />)}</div>
                      <div className="flex gap-1">{Array.from({ length: 5 }).map((_, j) => <SkeletonAvatar key={j} size="sm" />)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            : featuredGames.map((game) => {
                const minutes = Math.floor(game.gameLength / 60);
                const queueLabel = game.queueId === 420 ? "Solo/Duo" : "Flex";
                return (
                  <Card key={game.gameId} className="hover:border-primary/50 transition-all hover:shadow-md">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge emphasis="info" emphasisVariant="subtle" className="text-xs">
                          {queueLabel}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {minutes > 0 ? `${minutes} min` : "En cours"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-blue-500 font-semibold mr-1">Blue</span>
                          {game.blueTeam.map((p, i) => (
                            <ChampionIcon
                              key={i}
                              championKey={p.championId}
                              championKeyToId={championKeyToIdMap}
                              size={28}
                              shape="circle"
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">VS</span>
                        <div className="flex items-center gap-1">
                          {game.redTeam.map((p, i) => (
                            <ChampionIcon
                              key={i}
                              championKey={p.championId}
                              championKeyToId={championKeyToIdMap}
                              size={28}
                              shape="circle"
                            />
                          ))}
                          <span className="text-[10px] text-red-500 font-semibold ml-1">Red</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>
      </div>
    </section>
  );
};

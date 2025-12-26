"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { UserIcon } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";

type SummonerHeaderProps = {
  loading: boolean;
  details: {
    puuid: string;
    gameName?: string;
    tagLine?: string;
    summonerLevel?: number | null;
    profileIconId?: number | null;
  } | null;
  profileIconUrl: string | null;
  region?: string;
  ladderRank: number | null;
  topPercentage: number | null;
};

export const SummonerHeader = ({
  loading,
  details,
  profileIconUrl,
  region,
  ladderRank,
  topPercentage,
}: SummonerHeaderProps) => {
  return (
    <div className="flex items-start gap-6">
      {/* Avatar avec badge du niveau */}
      <div className="relative shrink-0">
        {loading ? (
          <Skeleton className="size-28 rounded-full" aria-busy="true" />
        ) : (
          <>
            {profileIconUrl ? (
              <Avatar className="size-28 border-4 border-primary/20">
                <AvatarImage src={profileIconUrl} alt="Profile" />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="size-28 border-4 border-primary/20">
                <AvatarFallback className="bg-linear-to-br from-primary to-primary/60 text-4xl">
                  {details?.gameName?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            )}
            {details?.summonerLevel && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-lg bg-muted px-2 py-0.5 text-xs font-semibold shadow-sm">
                {details.summonerLevel}
              </div>
            )}
          </>
        )}
      </div>

      {/* Informations du profil */}
      <div className="flex-1 space-y-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-32" />
          </div>
        ) : (
          <>
            {/* Nom d'utilisateur avec icône étoile */}
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                {details?.gameName || details?.puuid}
                {details?.tagLine && (
                  <span className="text-muted-foreground">
                    #{details.tagLine}
                  </span>
                )}
              </h1>
              {details?.puuid && region && (
                <FavoriteButton
                  puuid={details.puuid}
                  region={region}
                  gameName={details.gameName}
                  tagLine={details.tagLine}
                  variant="icon"
                />
              )}
            </div>

            {/* Région et Rang Ladder */}
            <div className="flex items-center gap-4 text-sm">
              {region && (
                <div className="flex items-center gap-1.5">
                  <UserIcon className="size-4 text-muted-foreground" />
                  <span className="font-medium">{region.toUpperCase()}</span>
                </div>
              )}
              {ladderRank && (
                <>
                  <span className="text-muted-foreground">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Rang ladder</span>
                    <span className="font-semibold text-primary">
                      {ladderRank.toLocaleString("fr-FR")}
                    </span>
                    {topPercentage !== null && (
                      <span className="text-muted-foreground">
                        ({topPercentage.toFixed(2)}% du top)
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};


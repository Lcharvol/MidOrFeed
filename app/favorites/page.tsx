"use client";

import { useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  HeartIcon,
  Trash2Icon,
  ExternalLinkIcon,
  UsersIcon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useApiSWR } from "@/lib/hooks/swr";

type FavoritePlayer = {
  id: string;
  puuid: string;
  region: string;
  gameName: string | null;
  tagLine: string | null;
  note: string | null;
  createdAt: string;
};

type FavoritesResponse = {
  success: boolean;
  data: FavoritePlayer[];
};

type RecentMatch = {
  win: boolean;
  championId: string;
  kills: number;
  deaths: number;
  assists: number;
  gameCreation: string;
};

type MatchesResponse = {
  success: boolean;
  data: RecentMatch[];
};

const FavoriteCard = ({
  favorite,
  onRemove,
}: {
  favorite: FavoritePlayer;
  onRemove: (puuid: string) => void;
}) => {
  const { data: matchesData } = useApiSWR<MatchesResponse>(
    `/api/summoners/${favorite.puuid}/matches?limit=5`,
    { revalidateOnFocus: false }
  );

  const recentMatches = matchesData?.data || [];
  const recentWins = recentMatches.filter((m) => m.win).length;
  const recentLosses = recentMatches.length - recentWins;

  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardContent className="p-3 sm:pt-4 sm:p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <Avatar className="size-10 sm:size-14 border-2 border-primary/20 shrink-0">
            <AvatarFallback className="text-sm sm:text-lg">
              {favorite.gameName?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/summoners/${favorite.puuid}/overview?region=${favorite.region}`}
                className="font-semibold text-sm sm:text-base hover:text-primary transition-colors truncate"
              >
                {favorite.gameName || favorite.puuid.slice(0, 8)}
                {favorite.tagLine && (
                  <span className="text-muted-foreground text-xs sm:text-sm">#{favorite.tagLine}</span>
                )}
              </Link>
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemove(favorite.puuid)}
                >
                  <Trash2Icon className="size-3.5 sm:size-4 text-destructive" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" asChild>
                  <Link
                    href={`/summoners/${favorite.puuid}/overview?region=${favorite.region}`}
                  >
                    <ExternalLinkIcon className="size-3.5 sm:size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-muted-foreground">
              {favorite.region.toUpperCase()}
            </div>

            {recentMatches.length > 0 && (
              <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">Recent:</span>
                <div className="flex gap-0.5 sm:gap-1">
                  {recentMatches.map((match, i) => (
                    <div
                      key={i}
                      className={`size-1.5 sm:size-2 rounded-full ${match.win ? "bg-green-500" : "bg-red-500"}`}
                      title={`${match.kills}/${match.deaths}/${match.assists}`}
                    />
                  ))}
                </div>
                <span className="text-[10px] sm:text-xs">
                  <span className="text-green-500">{recentWins}W</span>
                  {" / "}
                  <span className="text-red-500">{recentLosses}L</span>
                </span>
              </div>
            )}

            {favorite.note && (
              <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground italic line-clamp-1 sm:line-clamp-none">
                {favorite.note}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function FavoritesPage() {
  const { user } = useAuth();

  const { data, isLoading, mutate } = useApiSWR<FavoritesResponse>(
    user ? "/api/favorites" : null,
    { revalidateOnFocus: false }
  );

  const handleRemove = useCallback(
    async (puuid: string) => {
      try {
        const res = await fetch(`/api/favorites?puuid=${puuid}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Erreur");
        toast.success("Joueur retire des favoris");
        mutate();
      } catch {
        toast.error("Erreur lors de la suppression");
      }
    },
    [mutate]
  );

  if (!user) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <HeartIcon className="size-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Favoris</h1>
        <p className="text-muted-foreground mb-6">
          Connectez-vous pour voir et gerer vos joueurs favoris
        </p>
        <Button asChild>
          <Link href="/login">Se connecter</Link>
        </Button>
      </div>
    );
  }

  const favorites = data?.data || [];

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4 max-w-4xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <HeartIcon className="size-6 sm:size-8 text-red-500" />
            Mes Favoris
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Suivez vos joueurs preferes
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="w-fit">
          <Link href="/compare">
            <UsersIcon className="size-4 mr-2" />
            Comparer
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="size-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <HeartIcon className="size-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucun favori</h2>
            <p className="text-muted-foreground mb-6">
              Ajoutez des joueurs a vos favoris depuis leur profil pour les suivre ici
            </p>
            <Button asChild>
              <Link href="/leaderboard">Parcourir le classement</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {favorites.map((favorite) => (
            <FavoriteCard
              key={favorite.id}
              favorite={favorite}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

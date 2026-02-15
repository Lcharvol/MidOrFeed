"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { SkeletonAvatar } from "@/components/ui/skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  HeartIcon,
  Trash2Icon,
  ExternalLinkIcon,
  UsersIcon,
  HomeIcon,
  SearchIcon,
  StickyNoteIcon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useApiSWR } from "@/lib/hooks/swr";
import { getProfileIconUrl } from "@/constants/ddragon";

type FavoritePlayer = {
  id: string;
  puuid: string;
  region: string;
  gameName: string | null;
  tagLine: string | null;
  note: string | null;
  createdAt: string;
  profileIconId: number | null;
  summonerLevel: number | null;
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

const FavoriteCard = ({
  favorite,
  onRemove,
}: {
  favorite: FavoritePlayer;
  onRemove: (puuid: string) => void;
}) => {
  const { t } = useI18n();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data: matchesData } = useApiSWR<MatchesResponse>(
    `/api/summoners/${favorite.puuid}/matches?limit=5`,
    { revalidateOnFocus: false }
  );

  const recentMatches = matchesData?.data || [];
  const recentWins = recentMatches.filter((m) => m.win).length;
  const recentLosses = recentMatches.length - recentWins;

  const handleConfirmDelete = () => {
    onRemove(favorite.puuid);
    setShowDeleteDialog(false);
  };

  const regionEmphasis = REGION_EMPHASIS[favorite.region.toLowerCase()] ?? "neutral";

  return (
    <>
      <Card variant="interactive" className="group">
        <CardContent className="px-3 sm:px-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="relative shrink-0">
              <Avatar className="size-10 sm:size-14 border border-border">
                {favorite.profileIconId != null && (
                  <AvatarImage
                    src={getProfileIconUrl(favorite.profileIconId)}
                    alt={favorite.gameName || "Profile icon"}
                  />
                )}
                <AvatarFallback className="text-sm sm:text-lg">
                  {favorite.gameName?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              {favorite.summonerLevel != null && (
                <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-bold rounded-full size-5 sm:size-6 flex items-center justify-center border-2 border-background">
                  {favorite.summonerLevel}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/summoners/${favorite.puuid}/overview?region=${favorite.region}`}
                  className="font-semibold text-sm sm:text-base hover:text-primary transition-colors truncate"
                >
                  {favorite.gameName || favorite.puuid.slice(0, 8)}
                  {favorite.tagLine && (
                    <span className="text-muted-foreground text-xs sm:text-sm">
                      #{favorite.tagLine}
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={() => setShowDeleteDialog(true)}
                    aria-label={t("favorites.removeFromFavorites")}
                  >
                    <Trash2Icon className="size-3.5 sm:size-4 text-destructive" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" asChild>
                    <Link
                      href={`/summoners/${favorite.puuid}/overview?region=${favorite.region}`}
                      aria-label={t("favorites.viewProfile")}
                    >
                      <ExternalLinkIcon className="size-3.5 sm:size-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="mt-0.5">
                <Badge emphasis={regionEmphasis} emphasisVariant="subtle" rounded="full" className="text-[10px] sm:text-xs">
                  {favorite.region.toUpperCase()}
                </Badge>
              </div>

              {recentMatches.length > 0 && (
                <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">
                    Recent:
                  </span>
                  <div className="flex gap-0.5 sm:gap-1">
                    {recentMatches.map((match, i) => (
                      <Tooltip key={i}>
                        <TooltipTrigger asChild>
                          <div
                            className={`size-1.5 sm:size-2 rounded-full cursor-default ${match.win ? "bg-win" : "bg-loss"}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent sideOffset={4}>
                          {match.win ? t("favorites.victory") : t("favorites.defeat")} — {match.kills}/{match.deaths}/{match.assists}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                  <span className="text-[10px] sm:text-xs">
                    <span className="text-win">{recentWins}W</span>
                    {" / "}
                    <span className="text-loss">{recentLosses}L</span>
                  </span>
                </div>
              )}

              {favorite.note && (
                <div className="mt-1.5 sm:mt-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 text-muted-foreground cursor-default">
                        <StickyNoteIcon className="size-3 sm:size-3.5" />
                        <span className="text-[10px] sm:text-xs">Note</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={4} className="max-w-xs">
                      {favorite.note}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("favorites.removeConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("favorites.removeConfirmDescription")}{" "}
              <span className="font-semibold text-foreground">
                {favorite.gameName || favorite.puuid.slice(0, 8)}
              </span>
              {" ?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("favorites.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default function FavoritesPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [search, setSearch] = useState("");

  const { data, isLoading, mutate } = useApiSWR<FavoritesResponse>(
    user ? "/api/favorites" : null,
    { revalidateOnFocus: false }
  );

  const handleRemove = useCallback(
    async (puuid: string) => {
      const previousData = data;

      mutate(
        (current) => {
          if (!current) return current;
          return {
            ...current,
            data: current.data.filter((f) => f.puuid !== puuid),
          };
        },
        { revalidate: false }
      );

      try {
        const res = await fetch(`/api/favorites?puuid=${puuid}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `${t("common.error")} ${res.status}`);
        }
        toast.success(t("favorites.removedSuccess"));
      } catch (error) {
        mutate(previousData, { revalidate: false });
        const message = error instanceof Error ? error.message : t("common.error");
        toast.error(`${t("favorites.removeError")}: ${message}`, {
          description: t("favorites.removeErrorDescription"),
        });
      }
    },
    [mutate, data]
  );

  if (!user) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <HeartIcon className="size-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t("favorites.title")}</h1>
        <p className="text-muted-foreground mb-6">
          {t("favorites.loginPrompt")}
        </p>
        <Button asChild>
          <Link href="/login">{t("header.login")}</Link>
        </Button>
      </div>
    );
  }

  const favorites = data?.data || [];
  const searchLower = search.toLowerCase();
  const filteredFavorites = search
    ? favorites.filter(
        (f) =>
          f.gameName?.toLowerCase().includes(searchLower) ||
          f.tagLine?.toLowerCase().includes(searchLower) ||
          f.region.toLowerCase().includes(searchLower)
      )
    : favorites;

  return (
    <div className="container mx-auto py-8 sm:py-10 px-4 max-w-6xl">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">
                <HomeIcon className="size-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("favorites.title")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <HeartIcon className="size-6 sm:size-8 text-red-500" />
            {t("favorites.myFavorites")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {isLoading
              ? t("common.loading")
              : `${favorites.length} ${t("favorites.playersTracked")}`}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="w-fit">
          <Link href="/compare">
            <UsersIcon className="size-4 mr-2" />
            {t("header.nav.compare")}
          </Link>
        </Button>
      </div>

      {!isLoading && favorites.length > 0 && (
        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t("favorites.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="px-3 sm:px-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  <SkeletonAvatar size="lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((j) => (
                        <Skeleton key={j} className="size-2 rounded-full" />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HeartIcon />
            </EmptyMedia>
            <EmptyTitle>{t("favorites.noFavorites")}</EmptyTitle>
            <EmptyDescription>
              {t("favorites.noFavoritesDescription")}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/leaderboard">{t("favorites.browseLeaderboard")}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : search && filteredFavorites.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>{t("favorites.noResults")}</EmptyTitle>
            <EmptyDescription>
              {t("favorites.noResultsFor")} &quot;{search}&quot;
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => setSearch("")}>
              {t("favorites.clearSearch")}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredFavorites.map((favorite) => (
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

"use client";

import { useApiSWR, SEMI_DYNAMIC_CONFIG } from "@/lib/hooks/swr";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { HomeIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n-context";
import { getTierIconUrl, getProfileIconUrl, getChampionSplashUrl } from "@/constants/ddragon";
import {
  TIER_LABEL,
  TIER_TEXT,
  TIER_BORDER,
  TIER_GRADIENT,
  computeWinRate,
  getWinRateColor,
} from "@/lib/leaderboard-utils";
import { cn } from "@/lib/utils";

const REGIONS = [
  { label: "EUW", value: "euw1" },
  { label: "NA", value: "na1" },
  { label: "KR", value: "kr" },
  { label: "EUNE", value: "eun1" },
  { label: "BR", value: "br1" },
  { label: "LAN", value: "la1" },
  { label: "LAS", value: "la2" },
  { label: "JP", value: "jp1" },
  { label: "OCE", value: "oc1" },
];

const TIERS = [
  { label: "Challenger", value: "CHALLENGER" },
  { label: "Grandmaster", value: "GRANDMASTER" },
  { label: "Master", value: "MASTER" },
];

const LB_PAGE_SIZE = 50;

export default function LeaderboardPage() {
  const { t } = useI18n();
  const [region, setRegion] = useState("euw1");
  const [tier, setTier] = useState("CHALLENGER");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => { setPage(0); }, [region, tier, search]);

  const { data, isLoading } = useApiSWR(
    `/api/leaderboard/list?region=${region}&tier=${tier}`,
    SEMI_DYNAMIC_CONFIG
  );

  const allRows = useMemo(() => {
    const list: Array<{
      summonerId?: string;
      puuid?: string | null;
      summonerName: string;
      gameName?: string | null;
      tagLine?: string | null;
      leaguePoints: number;
      wins: number;
      losses: number;
      rank?: string | null;
      profileIconId?: number | null;
      mostPlayedChampion?: string | null;
    }> = data?.data ?? [];
    return search
      ? list.filter((e) =>
          e.summonerName.toLowerCase().includes(search.toLowerCase())
        )
      : list;
  }, [data, search]);

  const totalPages = Math.ceil(allRows.length / LB_PAGE_SIZE);
  const rows = allRows.slice(page * LB_PAGE_SIZE, (page + 1) * LB_PAGE_SIZE);

  const isFirstPage = page === 0 && !search;
  const top1 = isFirstPage ? rows[0] : null;
  const top2to5 = isFirstPage ? rows.slice(1, 5) : [];
  const tableRows = isFirstPage ? rows.slice(5) : rows;
  const tableStartIndex = isFirstPage ? 5 : page * LB_PAGE_SIZE;

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 space-y-6 sm:space-y-8">
      <Breadcrumb>
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
            <BreadcrumbPage>{t("leaderboard.title")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-2xl sm:text-4xl font-bold">{t("leaderboard.title")}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t("leaderboard.description")}
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger className="w-full sm:w-28">
            <SelectValue placeholder={t("leaderboard.region")} />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder={t("leaderboard.tier")} />
          </SelectTrigger>
          <SelectContent>
            {TIERS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative col-span-2 sm:w-56">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t("leaderboard.searchPlayer")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6" aria-live="polite" aria-busy={isLoading}>
        {isLoading ? (
          <LoadingSkeleton />
        ) : allRows.length === 0 ? (
          <Card>
            <CardContent>
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SearchIcon />
                  </EmptyMedia>
                  <EmptyTitle>{t("leaderboard.noResults")}</EmptyTitle>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* #1 Featured Card */}
            {top1 && (
              <FeaturedCard player={top1} tier={tier} region={region} />
            )}

            {/* #2-5 Grid */}
            {top2to5.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {top2to5.map((player, idx) => (
                  <TopCard key={player.summonerId ?? idx} player={player} rank={idx + 2} tier={tier} region={region} />
                ))}
              </div>
            )}

            {/* Table */}
            {tableRows.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table className="text-xs sm:text-sm">
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>{t("leaderboard.player")}</TableHead>
                          <TableHead className="hidden md:table-cell">{t("leaderboard.tier")}</TableHead>
                          <TableHead className="hidden md:table-cell">LP</TableHead>
                          <TableHead className="hidden md:table-cell">W/L</TableHead>
                          <TableHead>WR</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableRows.map((e, idx) => {
                          const wr = computeWinRate(e.wins, e.losses);
                          const wrNum = parseFloat(wr);
                          const globalIdx = tableStartIndex + idx;
                          return (
                            <TableRow key={`${e.summonerId}-${globalIdx}`} className="odd:bg-muted/30">
                              <TableCell className="tabular-nums font-medium text-muted-foreground">
                                {globalIdx + 1}
                              </TableCell>
                              <TableCell>
                                <PlayerCellContent player={e} tier={tier} region={region} />
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <span className={cn("font-medium", TIER_TEXT[tier])}>
                                  {TIER_LABEL[tier]}
                                </span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell tabular-nums font-semibold">
                                {e.leaguePoints.toLocaleString()}
                              </TableCell>
                              <TableCell className="hidden md:table-cell tabular-nums">
                                <span className="text-win">{e.wins}W</span>{" "}
                                <span className="text-loss">{e.losses}L</span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  emphasis={getWinRateColor(wrNum)}
                                  emphasisVariant="subtle"
                                  rounded="full"
                                  className="text-[10px]"
                                >
                                  {wr}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("leaderboard.showingRange")
                    .replace("{start}", String(page * LB_PAGE_SIZE + 1))
                    .replace("{end}", String(Math.min((page + 1) * LB_PAGE_SIZE, allRows.length)))
                    .replace("{total}", String(allRows.length))}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setPage((p) => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={page === 0}
                  >
                    <ChevronLeftIcon className="size-4 mr-1" />
                    <span className="hidden sm:inline">{t("leaderboard.previous")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    disabled={page >= totalPages - 1}
                  >
                    <span className="hidden sm:inline">{t("leaderboard.next")}</span>
                    <ChevronRightIcon className="size-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── #1 Featured Card ─── */
function FeaturedCard({
  player,
  tier,
  region,
}: {
  player: { puuid?: string | null; summonerName: string; leaguePoints: number; wins: number; losses: number; profileIconId?: number | null; mostPlayedChampion?: string | null };
  tier: string;
  region: string;
}) {
  const wr = computeWinRate(player.wins, player.losses);
  const wrNum = parseFloat(wr);
  const href = player.puuid ? `/summoners/${player.puuid}/overview?region=${region}` : undefined;

  const card = (
    <Card className={cn(
      "relative overflow-hidden border",
      TIER_BORDER[tier],
      href && "cursor-pointer transition-colors hover:bg-muted/30",
    )}>
      {/* Splash background */}
      {player.mostPlayedChampion && (
        <div className="pointer-events-none absolute inset-0 z-0">
          <Image
            src={getChampionSplashUrl(player.mostPlayedChampion)}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-right opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>
      )}
      {/* Fallback gradient when no splash */}
      {!player.mostPlayedChampion && (
        <div className={cn("absolute inset-0 z-0 bg-gradient-to-br", TIER_GRADIENT[tier], "to-transparent")} />
      )}

      <CardContent className="relative z-10 flex items-center gap-5 sm:gap-8 px-5 sm:px-8">
        {/* Rank number */}
        <span className={cn(
          "text-5xl sm:text-7xl font-black tabular-nums opacity-20 select-none shrink-0",
          TIER_TEXT[tier]
        )}>
          1
        </span>

        {/* Profile icon or tier icon fallback */}
        {player.profileIconId ? (
          <Image
            src={getProfileIconUrl(player.profileIconId)}
            alt={player.summonerName}
            width={80}
            height={80}
            className="shrink-0 rounded-full border-2 border-border drop-shadow-lg"
          />
        ) : (
          <Image
            src={getTierIconUrl(tier)}
            alt={TIER_LABEL[tier] ?? tier}
            width={80}
            height={80}
            className="shrink-0 drop-shadow-lg"
          />
        )}

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-lg sm:text-2xl font-bold truncate">{player.summonerName}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge emphasis="warning" emphasisVariant="subtle" rounded="full">
              {TIER_LABEL[tier]} &middot; {player.leaguePoints.toLocaleString()} LP
            </Badge>
            <span className="text-xs sm:text-sm text-muted-foreground tabular-nums">
              <span className="text-win">{player.wins}W</span>{" / "}
              <span className="text-loss">{player.losses}L</span>
            </span>
          </div>
        </div>

        {/* WR badge */}
        <Badge
          emphasis={getWinRateColor(wrNum)}
          emphasisVariant="subtle"
          rounded="full"
          className="text-sm shrink-0"
        >
          {wr}% WR
        </Badge>
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href}>{card}</Link>;
  return card;
}

/* ─── #2-5 Grid Card ─── */
function TopCard({
  player,
  rank,
  tier,
  region,
}: {
  player: { puuid?: string | null; summonerName: string; leaguePoints: number; wins: number; losses: number; summonerId?: string; profileIconId?: number | null; mostPlayedChampion?: string | null };
  rank: number;
  tier: string;
  region: string;
}) {
  const wr = computeWinRate(player.wins, player.losses);
  const wrNum = parseFloat(wr);
  const href = player.puuid ? `/summoners/${player.puuid}/overview?region=${region}` : undefined;

  const card = (
    <Card className={cn(
      "relative overflow-hidden transition-colors",
      href && "cursor-pointer hover:bg-muted/30",
    )}>
      {/* Splash background */}
      {player.mostPlayedChampion && (
        <div className="pointer-events-none absolute inset-0 z-0">
          <Image
            src={getChampionSplashUrl(player.mostPlayedChampion)}
            alt=""
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover object-right opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>
      )}

      <CardContent className="relative z-10 px-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black tabular-nums text-muted-foreground/50 select-none">
            {rank}
          </span>
          {player.profileIconId ? (
            <Image
              src={getProfileIconUrl(player.profileIconId)}
              alt={player.summonerName}
              width={48}
              height={48}
              className="shrink-0 rounded-full border border-border"
            />
          ) : (
            <Image
              src={getTierIconUrl(tier)}
              alt={TIER_LABEL[tier] ?? tier}
              width={48}
              height={48}
              className="shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate text-sm">{player.summonerName}</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {player.leaguePoints.toLocaleString()} LP
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="tabular-nums text-muted-foreground">
            <span className="text-win">{player.wins}W</span>{" "}
            <span className="text-loss">{player.losses}L</span>
          </span>
          <Badge
            emphasis={getWinRateColor(wrNum)}
            emphasisVariant="subtle"
            rounded="full"
            className="text-[10px]"
          >
            {wr}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href}>{card}</Link>;
  return card;
}

/* ─── Player Cell (table rows) ─── */
function PlayerCellContent({
  player,
  tier,
  region,
}: {
  player: { puuid?: string | null; summonerName: string; profileIconId?: number | null; leaguePoints: number; wins: number; losses: number };
  tier: string;
  region: string;
}) {
  const content = (
    <div className={cn("flex items-center gap-2", player.puuid && "hover:underline")}>
      {player.profileIconId ? (
        <Image
          src={getProfileIconUrl(player.profileIconId)}
          alt={player.summonerName}
          width={24}
          height={24}
          className="shrink-0 rounded-full"
        />
      ) : (
        <Image
          src={getTierIconUrl(tier)}
          alt={TIER_LABEL[tier] ?? tier}
          width={24}
          height={24}
          className="shrink-0"
        />
      )}
      <div className="min-w-0">
        <span className="font-medium truncate block">{player.summonerName}</span>
        <span className="text-[10px] text-muted-foreground md:hidden">
          {player.leaguePoints} LP &middot; {player.wins}W {player.losses}L
        </span>
      </div>
    </div>
  );

  if (player.puuid) {
    return <Link href={`/summoners/${player.puuid}/overview?region=${region}`}>{content}</Link>;
  }
  return content;
}

/* ─── Loading Skeleton ─── */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* #1 skeleton */}
      <Card>
        <CardContent className="flex items-center gap-5 sm:gap-8 px-5 sm:px-8">
          <Skeleton className="h-16 w-10 rounded" />
          <Skeleton className="size-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </CardContent>
      </Card>

      {/* #2-5 skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="px-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-6 rounded" />
                <Skeleton className="size-12 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-10 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-4 w-32 flex-1" />
                <Skeleton className="h-4 w-12 hidden md:block" />
                <Skeleton className="h-4 w-16 hidden md:block" />
                <Skeleton className="h-4 w-10 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useApiSWR, SEMI_DYNAMIC_CONFIG } from "@/lib/hooks/swr";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";

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

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [region, tier, search]);

  const { data, isLoading } = useApiSWR(
    `/api/leaderboard/list?region=${region}&tier=${tier}`,
    SEMI_DYNAMIC_CONFIG
  );

  const allRows = useMemo(() => {
    const list: Array<{
      summonerName: string;
      leaguePoints: number;
      wins: number;
      losses: number;
      rank?: string | null;
    }> = data?.data ?? [];
    return search
      ? list.filter((e) =>
          e.summonerName.toLowerCase().includes(search.toLowerCase())
        )
      : list;
  }, [data, search]);

  const totalPages = Math.ceil(allRows.length / LB_PAGE_SIZE);
  const rows = allRows.slice(page * LB_PAGE_SIZE, (page + 1) * LB_PAGE_SIZE);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10 space-y-4 sm:space-y-6">
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

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:gap-2 sm:flex-row sm:items-end sm:justify-between p-4 sm:p-6">
          <div>
            <CardTitle className="text-base sm:text-lg">{t("leaderboard.ranking")}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("leaderboard.updatedPeriodically")}
            </CardDescription>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2 w-full sm:w-auto">
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
                {TIERS.map((tier) => (
                  <SelectItem key={tier.value} value={tier.value}>
                    {tier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder={t("leaderboard.searchPlayer")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="col-span-2 sm:w-44"
            />
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="overflow-x-auto -mx-3 sm:mx-0 rounded-md border" aria-live="polite" aria-busy={isLoading}>
            <Table className="text-xs sm:text-sm">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-10 sm:w-12">#</TableHead>
                  <TableHead>{t("leaderboard.player")}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    <Tooltip>
                      <TooltipTrigger asChild><span className="cursor-help">LP</span></TooltipTrigger>
                      <TooltipContent>League Points — Points de classement</TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">{t("leaderboard.victories")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("leaderboard.defeats")}</TableHead>
                  <TableHead>
                    <Tooltip>
                      <TooltipTrigger asChild><span className="cursor-help">WR</span></TooltipTrigger>
                      <TooltipContent>Win Rate — Pourcentage de victoires</TooltipContent>
                    </Tooltip>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, idx) => (
                    <TableRow key={idx} className="odd:bg-muted/30">
                      <TableCell className="py-2 sm:py-4">
                        <Skeleton className="h-4 w-6" />
                      </TableCell>
                      <TableCell className="py-2 sm:py-4">
                        <div className="flex flex-col gap-1 sm:hidden">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-4 w-32 hidden sm:block" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell className="py-2 sm:py-4">
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Empty className="py-8">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <SearchIcon />
                          </EmptyMedia>
                          <EmptyTitle>{t("leaderboard.noResults")}</EmptyTitle>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((e: any, idx: number) => {
                    const total = e.wins + e.losses;
                    const wr =
                      total > 0 ? ((e.wins / total) * 100).toFixed(1) : "0.0";
                    const globalIdx = page * LB_PAGE_SIZE + idx;
                    return (
                      <TableRow
                        key={`${e.summonerId}-${globalIdx}`}
                        className="odd:bg-muted/30"
                      >
                        <TableCell className="tabular-nums py-2 sm:py-4">
                          {globalIdx + 1}
                        </TableCell>
                        <TableCell className="py-2 sm:py-4">
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <span className="cursor-default">
                                <span className="flex flex-col sm:hidden">
                                  <span className="font-medium truncate max-w-[120px]">{e.summonerName}</span>
                                  <span className="text-[10px] text-muted-foreground">{e.leaguePoints} LP • {e.wins}W {e.losses}L</span>
                                </span>
                                <span className="hidden sm:inline font-medium">{e.summonerName}</span>
                              </span>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-64">
                              <div className="space-y-3">
                                <p className="text-sm font-semibold">{e.summonerName}</p>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">LP</span>
                                  <span className="font-semibold tabular-nums">{e.leaguePoints}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">W / L</span>
                                  <span className="tabular-nums">
                                    <span className="text-win">{e.wins}W</span>
                                    {" / "}
                                    <span className="text-loss">{e.losses}L</span>
                                  </span>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Win rate</span>
                                    <span className="font-semibold tabular-nums">{wr}%</span>
                                  </div>
                                  <Progress value={Number(wr)} className="h-2" />
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </TableCell>
                        <TableCell className="tabular-nums hidden sm:table-cell">
                          {e.leaguePoints}
                        </TableCell>
                        <TableCell className="tabular-nums hidden sm:table-cell">{e.wins}</TableCell>
                        <TableCell className="tabular-nums hidden sm:table-cell">
                          {e.losses}
                        </TableCell>
                        <TableCell className="tabular-nums py-2 sm:py-4">{wr}%</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {page * LB_PAGE_SIZE + 1}-{Math.min((page + 1) * LB_PAGE_SIZE, allRows.length)} sur {allRows.length} joueurs
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                >
                  <ChevronLeftIcon className="size-4 mr-1" />
                  <span className="hidden sm:inline">Précédent</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <ChevronRightIcon className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
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
import { HomeIcon } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

export default function LeaderboardPage() {
  const { t } = useI18n();
  const [region, setRegion] = useState("euw1");
  const [tier, setTier] = useState("CHALLENGER");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useSWR(
    `/api/leaderboard/list?region=${region}&tier=${tier}`,
    fetcher
  );

  const rows = useMemo(() => {
    const list: Array<{
      summonerName: string;
      leaguePoints: number;
      wins: number;
      losses: number;
      rank?: string | null;
    }> = data?.data ?? [];
    const filtered = search
      ? list.filter((e) =>
          e.summonerName.toLowerCase().includes(search.toLowerCase())
        )
      : list;
    return filtered;
  }, [data, search]);

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
          <div className="overflow-x-auto -mx-3 sm:mx-0 rounded-md border">
            <Table className="text-xs sm:text-sm">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-10 sm:w-12">#</TableHead>
                  <TableHead>{t("leaderboard.player")}</TableHead>
                  <TableHead className="hidden sm:table-cell">LP</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("leaderboard.victories")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("leaderboard.defeats")}</TableHead>
                  <TableHead>WR</TableHead>
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
                      <div className="py-8 text-center text-muted-foreground">
                        {t("leaderboard.noResults")}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((e: any, idx: number) => {
                    const total = e.wins + e.losses;
                    const wr =
                      total > 0 ? ((e.wins / total) * 100).toFixed(1) : "0.0";
                    return (
                      <TableRow
                        key={`${e.summonerId}-${idx}`}
                        className="odd:bg-muted/30"
                      >
                        <TableCell className="tabular-nums py-2 sm:py-4">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="py-2 sm:py-4">
                          <div className="flex flex-col sm:hidden">
                            <span className="font-medium truncate max-w-[120px]">{e.summonerName}</span>
                            <span className="text-[10px] text-muted-foreground">{e.leaguePoints} LP • {e.wins}W {e.losses}L</span>
                          </div>
                          <span className="hidden sm:inline">{e.summonerName}</span>
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
        </CardContent>
      </Card>
    </div>
  );
}

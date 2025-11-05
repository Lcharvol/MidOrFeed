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
    <div className="container mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">
          Top joueurs classés (solo queue)
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Classement</CardTitle>
            <CardDescription>
              Mise à jour périodiquement depuis Riot
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Région" />
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
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Palier" />
              </SelectTrigger>
              <SelectContent>
                {TIERS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Rechercher un joueur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Joueur</TableHead>
                  <TableHead>LP</TableHead>
                  <TableHead>Victoires</TableHead>
                  <TableHead>Défaites</TableHead>
                  <TableHead>WR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="py-8 text-center text-muted-foreground">
                        Chargement...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="py-8 text-center text-muted-foreground">
                        Aucun résultat
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
                        <TableCell className="tabular-nums">
                          {idx + 1}
                        </TableCell>
                        <TableCell>{e.summonerName}</TableCell>
                        <TableCell className="tabular-nums">
                          {e.leaguePoints}
                        </TableCell>
                        <TableCell className="tabular-nums">{e.wins}</TableCell>
                        <TableCell className="tabular-nums">
                          {e.losses}
                        </TableCell>
                        <TableCell className="tabular-nums">{wr}%</TableCell>
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

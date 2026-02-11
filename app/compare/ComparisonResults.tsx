"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SwordsIcon,
  ShieldIcon,
  ZapIcon,
  EyeIcon,
  TrophyIcon,
  TargetIcon,
  CoinsIcon,
  FlameIcon,
  HeartIcon,
  BanIcon,
  TrendingUpIcon,
  ClockIcon,
  CrownIcon,
  UsersIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { PlayerCard } from "./PlayerCard";
import { StatCompareRow } from "./StatCompareRow";
import { TopChampionsSection, RoleDistributionSection, CommonChampionsSection } from "./ChampionComponents";
import { DuoSynergySection, BanRecommendationsSection } from "./DuoSynergySection";
import { LazyLoadingFallback } from "@/lib/lazy-components";
import type { PlayerData, CommonChampion, DuoSynergy, BanRecommendation } from "./types";

const PlaystyleRadar = dynamic(
  () => import("./PlaystyleRadar").then((m) => ({ default: m.PlaystyleRadar })),
  { loading: LazyLoadingFallback, ssr: false }
);

const RankProgressionChart = dynamic(
  () => import("./RankProgressionChart").then((m) => ({ default: m.RankProgressionChart })),
  { loading: LazyLoadingFallback, ssr: false }
);

export const ComparisonResults = ({
  player1,
  player2,
  comparison,
  isLoading,
}: {
  player1: PlayerData | null;
  player2: PlayerData | null;
  comparison: {
    commonChampions: CommonChampion[];
    duoSynergy: DuoSynergy;
    bansAgainstPlayer1: BanRecommendation[];
    bansAgainstPlayer2: BanRecommendation[];
  } | null;
  isLoading: boolean;
}) => {
  const hasData = player1 && player2 && comparison;

  return (
    <div className="space-y-6">
      {/* Player headers */}
      <Card className="border-border/60 shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 p-4 sm:p-6">
          <CardTitle className="text-center flex items-center justify-center gap-2 text-base sm:text-lg">
            <TrophyIcon className="size-4 sm:size-5 text-primary" />
            Vue d&apos;ensemble
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className="flex-1 min-w-0">
              <PlayerCard player={player1} loading={isLoading} />
            </div>
            <div className="flex items-center justify-center pt-4 sm:pt-8 shrink-0">
              <div className="size-10 sm:size-14 rounded-full bg-gradient-to-br from-blue-500/20 to-red-500/20 flex items-center justify-center border border-border/50">
                <span className="font-bold text-sm sm:text-lg text-muted-foreground">
                  VS
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <PlayerCard player={player2} loading={isLoading} />
            </div>
          </div>
        </CardContent>
      </Card>

      {hasData && (
        <Tabs defaultValue="stats" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-4">
            <TabsTrigger value="stats" className="text-xs sm:text-sm">
              <TargetIcon className="size-3 sm:size-4 mr-1" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="champions" className="text-xs sm:text-sm">
              <CrownIcon className="size-3 sm:size-4 mr-1" />
              Champions
            </TabsTrigger>
            <TabsTrigger value="playstyle" className="text-xs sm:text-sm">
              <FlameIcon className="size-3 sm:size-4 mr-1" />
              Playstyle
            </TabsTrigger>
            <TabsTrigger value="synergy" className="text-xs sm:text-sm">
              <UsersIcon className="size-3 sm:size-4 mr-1" />
              Duo
            </TabsTrigger>
            <TabsTrigger value="progression" className="text-xs sm:text-sm">
              <TrendingUpIcon className="size-3 sm:size-4 mr-1" />
              Progression
            </TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Combat Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <SwordsIcon className="size-4 text-primary" />
                    Stats de combat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 bg-muted/20 rounded-xl p-3 border border-border/50">
                  <StatCompareRow
                    label="Win Rate"
                    value1={player1.stats.winRate}
                    value2={player2.stats.winRate}
                    icon={<TrophyIcon className="size-4" />}
                    format={(v) => `${v.toFixed(1)}%`}
                  />
                  <StatCompareRow
                    label="KDA"
                    value1={player1.stats.avgKDA}
                    value2={player2.stats.avgKDA}
                    icon={<TargetIcon className="size-4" />}
                  />
                  <StatCompareRow
                    label="Kills"
                    value1={player1.stats.avgKills}
                    value2={player2.stats.avgKills}
                    icon={<SwordsIcon className="size-4" />}
                  />
                  <StatCompareRow
                    label="Deaths"
                    value1={player1.stats.avgDeaths}
                    value2={player2.stats.avgDeaths}
                    icon={<ShieldIcon className="size-4" />}
                    higherIsBetter={false}
                  />
                  <StatCompareRow
                    label="Assists"
                    value1={player1.stats.avgAssists}
                    value2={player2.stats.avgAssists}
                    icon={<UsersIcon className="size-4" />}
                  />
                  <StatCompareRow
                    label="Degats"
                    value1={player1.stats.avgDamageDealt}
                    value2={player2.stats.avgDamageDealt}
                    icon={<ZapIcon className="size-4" />}
                    format={(v) => `${(v / 1000).toFixed(1)}k`}
                  />
                  <StatCompareRow
                    label="Degats subis"
                    value1={player1.stats.avgDamageTaken}
                    value2={player2.stats.avgDamageTaken}
                    icon={<HeartIcon className="size-4" />}
                    format={(v) => `${(v / 1000).toFixed(1)}k`}
                    higherIsBetter={false}
                  />
                </CardContent>
              </Card>

              {/* Economy & Vision Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CoinsIcon className="size-4 text-primary" />
                    Economie & Vision
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 bg-muted/20 rounded-xl p-3 border border-border/50">
                  <StatCompareRow
                    label="Gold/min"
                    value1={player1.stats.goldPerMin}
                    value2={player2.stats.goldPerMin}
                    icon={<CoinsIcon className="size-4" />}
                    format={(v) => v.toFixed(0)}
                  />
                  <StatCompareRow
                    label="Degats/min"
                    value1={player1.stats.damagePerMin}
                    value2={player2.stats.damagePerMin}
                    icon={<ZapIcon className="size-4" />}
                    format={(v) => v.toFixed(0)}
                  />
                  <StatCompareRow
                    label="Vision"
                    value1={player1.stats.avgVisionScore}
                    value2={player2.stats.avgVisionScore}
                    icon={<EyeIcon className="size-4" />}
                  />
                  <StatCompareRow
                    label="Gold moyen"
                    value1={player1.stats.avgGoldEarned}
                    value2={player2.stats.avgGoldEarned}
                    icon={<CoinsIcon className="size-4" />}
                    format={(v) => `${(v / 1000).toFixed(1)}k`}
                  />
                  <StatCompareRow
                    label="Duree moy."
                    value1={player1.stats.avgGameDuration}
                    value2={player2.stats.avgGameDuration}
                    icon={<ClockIcon className="size-4" />}
                    format={(v) => `${v.toFixed(0)}m`}
                    higherIsBetter={false}
                  />
                  <StatCompareRow
                    label="Parties"
                    value1={player1.stats.totalGames}
                    value2={player2.stats.totalGames}
                    icon={<TargetIcon className="size-4" />}
                    format={(v) => v.toString()}
                  />
                  <StatCompareRow
                    label="Forme recente"
                    value1={player1.recentForm.last10WinRate}
                    value2={player2.recentForm.last10WinRate}
                    icon={<FlameIcon className="size-4" />}
                    format={(v) => `${v.toFixed(0)}%`}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Champions Tab */}
          <TabsContent value="champions">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="size-2 rounded-full bg-blue-500" />
                    {player1.gameName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TopChampionsSection champions={player1.topChampions} title="Top Champions" />
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Roles</h4>
                    <RoleDistributionSection roles={player1.roleDistribution} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <SwordsIcon className="size-4 text-primary" />
                    Champions en commun
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CommonChampionsSection champions={comparison.commonChampions} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="size-2 rounded-full bg-red-500" />
                    {player2.gameName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TopChampionsSection champions={player2.topChampions} title="Top Champions" />
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Roles</h4>
                    <RoleDistributionSection roles={player2.roleDistribution} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Playstyle Tab */}
          <TabsContent value="playstyle">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FlameIcon className="size-4 text-primary" />
                  Analyse du Playstyle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlaystyleRadar player1={player1} player2={player2} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Duo/Synergy Tab */}
          <TabsContent value="synergy">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UsersIcon className="size-4 text-primary" />
                    Synergie Duo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DuoSynergySection synergy={comparison.duoSynergy} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BanIcon className="size-4 text-loss" />
                    Bans Recommandes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <BanRecommendationsSection
                    bans={comparison.bansAgainstPlayer1}
                    playerName={player1.gameName}
                  />
                  <BanRecommendationsSection
                    bans={comparison.bansAgainstPlayer2}
                    playerName={player2.gameName}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Progression Tab */}
          <TabsContent value="progression">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUpIcon className="size-4 text-primary" />
                  Progression de Rang
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RankProgressionChart player1={player1} player2={player2} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

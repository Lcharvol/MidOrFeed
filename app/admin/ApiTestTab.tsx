"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionIcon } from "@/components/ChampionIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioIcon,
  AlertTriangleIcon,
  WrenchIcon,
  TrophyIcon,
  Loader2Icon,
  RefreshCwIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useChampions } from "@/lib/hooks/use-champions";
import { authenticatedFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const REGIONS = [
  { value: "euw1", label: "EU West" },
  { value: "eun1", label: "EU Nordic & East" },
  { value: "na1", label: "North America" },
  { value: "kr", label: "Korea" },
  { value: "br1", label: "Brazil" },
  { value: "jp1", label: "Japan" },
  { value: "oc1", label: "Oceania" },
  { value: "tr1", label: "Turkey" },
  { value: "ru", label: "Russia" },
  { value: "la1", label: "Latin America North" },
  { value: "la2", label: "Latin America South" },
];

type LiveGameData = {
  success: boolean;
  inGame: boolean;
  data: {
    gameId: number;
    gameMode: string;
    gameType: string;
    gameLength: number;
    participants: Array<{
      puuid: string;
      riotId: string;
      teamId: number;
      championId: number;
      isCurrentPlayer: boolean;
    }>;
    bannedChampions: Array<{
      championId: number;
      teamId: number;
    }>;
  } | null;
};

type StatusData = {
  success: boolean;
  data: {
    platform: string;
    platformName: string;
    hasIssues: boolean;
    maintenances: Array<{
      id: number;
      status: string;
      title: string;
      description: string | null;
    }>;
    incidents: Array<{
      id: number;
      severity: string;
      title: string;
      description: string | null;
    }>;
  };
};

type MasteryData = {
  success: boolean;
  data: {
    totalScore: number;
    topMasteries: Array<{
      championId: number;
      level: number;
      points: number;
      chestGranted: boolean;
      tokensEarned: number;
    }>;
  };
};

export const ApiTestTab = () => {
  const { user } = useAuth();
  const { championKeyToIdMap, resolveName } = useChampions();

  const [region, setRegion] = useState(user?.riotRegion || "euw1");
  const [puuid, setPuuid] = useState(user?.riotPuuid || "");

  const [liveGameLoading, setLiveGameLoading] = useState(false);
  const [liveGameData, setLiveGameData] = useState<LiveGameData | null>(null);
  const [liveGameError, setLiveGameError] = useState<string | null>(null);

  const [statusLoading, setStatusLoading] = useState(false);
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [masteryLoading, setMasteryLoading] = useState(false);
  const [masteryData, setMasteryData] = useState<MasteryData | null>(null);
  const [masteryError, setMasteryError] = useState<string | null>(null);

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

  const testStatus = async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const res = await authenticatedFetch(`/api/riot/status?region=${region}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur API");
      }

      setStatusData(data);
      toast.success(
        data.data.hasIssues
          ? `${data.data.incidents.length + data.data.maintenances.length} probleme(s) detecte(s)`
          : "Aucun probleme detecte"
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setStatusError(message);
      toast.error(message);
    } finally {
      setStatusLoading(false);
    }
  };

  const testMastery = async () => {
    if (!puuid) {
      toast.error("PUUID requis");
      return;
    }

    setMasteryLoading(true);
    setMasteryError(null);
    try {
      const res = await authenticatedFetch(
        `/api/summoners/${puuid}/mastery?region=${region}&count=10`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur API");
      }

      setMasteryData(data);
      toast.success(`${data.data.topMasteries.length} maitrises recuperees`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setMasteryError(message);
      toast.error(message);
    } finally {
      setMasteryLoading(false);
    }
  };

  const formatGameTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Parametres pour tester les APIs Riot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger id="region">
                  <SelectValue placeholder="Selectionnez une region" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="puuid">PUUID</Label>
              <Input
                id="puuid"
                value={puuid}
                onChange={(e) => setPuuid(e.target.value)}
                placeholder="Entrez un PUUID"
              />
              {user?.riotPuuid && puuid !== user.riotPuuid && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setPuuid(user.riotPuuid || "")}
                >
                  Utiliser mon PUUID
                </Button>
              )}
            </div>
          </div>
          {user?.riotPuuid && (
            <div className="text-sm text-muted-foreground">
              Votre compte: <span className="font-medium">{user.riotGameName}#{user.riotTagLine}</span>
              {" "}({user.riotRegion?.toUpperCase()})
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Game Test */}
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

                  <div className="grid grid-cols-2 gap-4">
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

      {/* Server Status Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangleIcon className="size-5 text-amber-500" />
                Server Status (lol-status-v4)
              </CardTitle>
              <CardDescription>
                Verifie le statut des serveurs Riot pour la region
              </CardDescription>
            </div>
            <Button onClick={testStatus} disabled={statusLoading}>
              {statusLoading ? (
                <Loader2Icon className="size-4 animate-spin mr-2" />
              ) : (
                <RefreshCwIcon className="size-4 mr-2" />
              )}
              Tester
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {statusError && (
            <div className="flex items-center gap-2 text-destructive mb-4">
              <XCircleIcon className="size-4" />
              <span className="text-sm">{statusError}</span>
            </div>
          )}

          {statusData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {statusData.data.hasIssues ? (
                  <>
                    <AlertTriangleIcon className="size-5 text-amber-500" />
                    <span className="font-medium text-amber-600">
                      Problemes detectes sur {statusData.data.platformName}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="size-5 text-green-500" />
                    <span className="font-medium text-green-600">
                      {statusData.data.platformName} - Aucun probleme
                    </span>
                  </>
                )}
              </div>

              {statusData.data.hasIssues && (
                <div className="space-y-2">
                  {statusData.data.incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        incident.severity === "critical"
                          ? "bg-red-500/10 border-red-500/30"
                          : incident.severity === "warning"
                            ? "bg-amber-500/10 border-amber-500/30"
                            : "bg-blue-500/10 border-blue-500/30"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangleIcon className="size-4" />
                        <span className="font-medium">{incident.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {incident.severity}
                        </Badge>
                      </div>
                      {incident.description && (
                        <p className="text-sm text-muted-foreground">{incident.description}</p>
                      )}
                    </div>
                  ))}

                  {statusData.data.maintenances.map((maintenance) => (
                    <div
                      key={maintenance.id}
                      className="p-3 rounded-lg border bg-blue-500/10 border-blue-500/30"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <WrenchIcon className="size-4" />
                        <span className="font-medium">{maintenance.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {maintenance.status}
                        </Badge>
                      </div>
                      {maintenance.description && (
                        <p className="text-sm text-muted-foreground">{maintenance.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!statusData && !statusError && !statusLoading && (
            <div className="text-sm text-muted-foreground">
              Cliquez sur Tester pour verifier le statut des serveurs
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mastery Test */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrophyIcon className="size-5 text-amber-500" />
                Champion Mastery (champion-mastery-v4)
              </CardTitle>
              <CardDescription>
                Recupere les maitrises de champions du joueur
              </CardDescription>
            </div>
            <Button onClick={testMastery} disabled={masteryLoading || !puuid}>
              {masteryLoading ? (
                <Loader2Icon className="size-4 animate-spin mr-2" />
              ) : (
                <RefreshCwIcon className="size-4 mr-2" />
              )}
              Tester
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {masteryError && (
            <div className="flex items-center gap-2 text-destructive mb-4">
              <XCircleIcon className="size-4" />
              <span className="text-sm">{masteryError}</span>
            </div>
          )}

          {masteryData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="size-5 text-green-500" />
                <span className="font-medium">
                  Score total: {masteryData.data.totalScore.toLocaleString()} points
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {masteryData.data.topMasteries.map((mastery) => {
                  const champSlug = championKeyToIdMap.get(String(mastery.championId)) || String(mastery.championId);
                  return (
                    <div
                      key={mastery.championId}
                      className="relative rounded-lg overflow-hidden border"
                    >
                      <ChampionIcon
                        championId={champSlug}
                        size={64}
                        className="w-full aspect-square"
                      />
                      <div
                        className={cn(
                          "absolute top-0.5 right-0.5 size-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
                          mastery.level === 7
                            ? "bg-amber-500"
                            : mastery.level === 6
                              ? "bg-fuchsia-500"
                              : mastery.level === 5
                                ? "bg-red-500"
                                : "bg-gray-500"
                        )}
                      >
                        {mastery.level}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                        <div className="text-[9px] text-white text-center">
                          {(mastery.points / 1000).toFixed(0)}K
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!masteryData && !masteryError && !masteryLoading && (
            <div className="text-sm text-muted-foreground">
              Cliquez sur Tester pour recuperer les maitrises
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

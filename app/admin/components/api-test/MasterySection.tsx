"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChampionIcon } from "@/components/ChampionIcon";
import {
  TrophyIcon,
  Loader2Icon,
  RefreshCwIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useChampions } from "@/lib/hooks/use-champions";
import { authenticatedFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { MasteryData } from "./types";

interface MasterySectionProps {
  region: string;
  puuid: string;
}

export const MasterySection = ({ region, puuid }: MasterySectionProps) => {
  const { championKeyToIdMap } = useChampions();

  const [masteryLoading, setMasteryLoading] = useState(false);
  const [masteryData, setMasteryData] = useState<MasteryData | null>(null);
  const [masteryError, setMasteryError] = useState<string | null>(null);

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

  return (
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
  );
};

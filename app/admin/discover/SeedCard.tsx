"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2Icon, PlayIcon } from "lucide-react";
import { RIOT_REGIONS } from "@/lib/riot-regions";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n-context";

interface SeedCardProps {
  onSeedComplete: () => void;
}

export function SeedCard({ onSeedComplete }: SeedCardProps) {
  const { t } = useI18n();
  const [seedRegion, setSeedRegion] = useState("euw1");
  const [seedCount, setSeedCount] = useState("50");
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch("/api/crawl/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: seedRegion,
          count: parseInt(seedCount),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          t("admin.discover.seedCard.newPlayersDiscovered").replace("{count}", result.data.newPlayersAdded.toString())
        );
        onSeedComplete();
      } else {
        toast.error(result.error || t("admin.discover.seedCard.seedError"));
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(t("admin.discover.seedCard.errorOccurred"));
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card variant="gradient">
      <CardHeader withGlow>
        <CardTitle>{t("admin.discover.seedCard.title")}</CardTitle>
        <CardDescription>
          {t("admin.discover.seedCard.discoverNewPlayers")}
        </CardDescription>
        <CardAction>
          <Button
            onClick={handleSeed}
            disabled={isSeeding}
            className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            size="sm"
          >
            {isSeeding ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                {t("admin.discover.seedCard.discovering")}
              </>
            ) : (
              <>
                <PlayIcon className="mr-2 size-4" />
                {t("admin.discover.processCard.start")}
              </>
            )}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="region">{t("admin.discover.seedCard.region")}</Label>
          <Select value={seedRegion} onValueChange={setSeedRegion}>
            <SelectTrigger id="region">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RIOT_REGIONS.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="count">{t("admin.discover.seedCard.playerCount")}</Label>
          <Input
            id="count"
            type="number"
            min="1"
            value={seedCount}
            onChange={(e) => setSeedCount(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

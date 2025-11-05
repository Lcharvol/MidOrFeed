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

interface SeedCardProps {
  onSeedComplete: () => void;
}

export function SeedCard({ onSeedComplete }: SeedCardProps) {
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
          `${result.data.newPlayersAdded} nouveaux joueurs découverts`
        );
        onSeedComplete();
      } else {
        toast.error(result.error || "Erreur lors du seed");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card variant="gradient">
      <CardHeader withGlow>
        <CardTitle>Découverte de joueurs</CardTitle>
        <CardDescription>
          Découvrir de nouveaux joueurs depuis les matchs existants
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
                Découverte...
              </>
            ) : (
              <>
                <PlayIcon className="mr-2 size-4" />
                Démarrer
              </>
            )}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="region">Région</Label>
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
          <Label htmlFor="count">Nombre de joueurs</Label>
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

"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LightbulbIcon } from "lucide-react";

export const GuideGameplayTips = ({
  earlyGameTips,
  setEarlyGameTips,
  midGameTips,
  setMidGameTips,
  lateGameTips,
  setLateGameTips,
}: {
  earlyGameTips: string;
  setEarlyGameTips: (v: string) => void;
  midGameTips: string;
  setMidGameTips: (v: string) => void;
  lateGameTips: string;
  setLateGameTips: (v: string) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <LightbulbIcon className="size-5" />
        Conseils de jeu
      </CardTitle>
      <CardDescription>
        Partagez vos conseils pour chaque phase du jeu
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="early">Early Game (Niv. 1-6)</Label>
        <Textarea
          id="early"
          value={earlyGameTips}
          onChange={(e) => setEarlyGameTips(e.target.value)}
          placeholder="Comment jouer les premières minutes, les trades, le farming..."
          rows={3}
          maxLength={2000}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mid">Mid Game (Niv. 7-12)</Label>
        <Textarea
          id="mid"
          value={midGameTips}
          onChange={(e) => setMidGameTips(e.target.value)}
          placeholder="Rotations, objectifs, teamfights..."
          rows={3}
          maxLength={2000}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="late">Late Game (Niv. 13+)</Label>
        <Textarea
          id="late"
          value={lateGameTips}
          onChange={(e) => setLateGameTips(e.target.value)}
          placeholder="Positionnement, focus, closing..."
          rows={3}
          maxLength={2000}
        />
      </div>
    </CardContent>
  </Card>
);

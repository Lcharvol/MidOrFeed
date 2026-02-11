"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ZapIcon } from "lucide-react";
import type { SkillOrderConfig, RuneConfig } from "@/types/guides";

const SkillOrderEditor = dynamic(
  () => import("@/components/build-tools").then((mod) => mod.SkillOrderEditor),
  { ssr: false, loading: () => <Skeleton className="h-24 w-full" /> }
);
const SummonerSpellSelector = dynamic(
  () => import("@/components/build-tools").then((mod) => mod.SummonerSpellSelector),
  { ssr: false, loading: () => <Skeleton className="h-12 w-full" /> }
);
const RuneSelector = dynamic(
  () => import("@/components/build-tools").then((mod) => mod.RuneSelector),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full" /> }
);

export const GuideSkillsAndSpells = ({
  skillOrder,
  setSkillOrder,
  summonerSpells,
  setSummonerSpells,
  runeConfig,
  setRuneConfig,
}: {
  skillOrder: SkillOrderConfig;
  setSkillOrder: (v: SkillOrderConfig) => void;
  summonerSpells: string[];
  setSummonerSpells: (v: string[]) => void;
  runeConfig: RuneConfig | null;
  setRuneConfig: (v: RuneConfig | null) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <ZapIcon className="size-5" />
        Compétences et sorts
      </CardTitle>
      <CardDescription>
        Définissez l'ordre des compétences et les sorts d'invocateur
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div>
        <Label className="mb-2 block">Ordre des compétences</Label>
        <SkillOrderEditor value={skillOrder} onChange={setSkillOrder} />
      </div>
      <Separator />
      <SummonerSpellSelector
        label="Sorts d'invocateur"
        selectedSpells={summonerSpells}
        onSpellsChange={setSummonerSpells}
      />
      <Separator />
      <RuneSelector
        label="Runes"
        value={runeConfig}
        onChange={setRuneConfig}
      />
    </CardContent>
  </Card>
);

"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GuideRole } from "@/types/guides";

const ChampionSelector = dynamic(
  () => import("@/components/build-tools").then((mod) => mod.ChampionSelector),
  { ssr: false, loading: () => <Skeleton className="h-12 w-full" /> }
);

const ROLES: { value: GuideRole; label: string }[] = [
  { value: "TOP", label: "Top" },
  { value: "JUNGLE", label: "Jungle" },
  { value: "MID", label: "Mid" },
  { value: "ADC", label: "ADC" },
  { value: "SUPPORT", label: "Support" },
];

export const GuideMetadataForm = ({
  championId,
  setChampionId,
  role,
  setRole,
  title,
  setTitle,
  patchVersion,
  setPatchVersion,
  availableVersions,
  introduction,
  setIntroduction,
}: {
  championId: string | null;
  setChampionId: (v: string | null) => void;
  role: GuideRole | "";
  setRole: (v: GuideRole) => void;
  title: string;
  setTitle: (v: string) => void;
  patchVersion: string;
  setPatchVersion: (v: string) => void;
  availableVersions: string[];
  introduction: string;
  setIntroduction: (v: string) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Informations de base</CardTitle>
      <CardDescription>
        Choisissez le champion et donnez un titre à votre guide
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Champion *</Label>
          <ChampionSelector
            value={championId}
            onChange={setChampionId}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rôle</Label>
          <Select value={role} onValueChange={(v) => setRole(v as GuideRole)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un rôle" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Titre du guide *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Guide Yasuo Mid S14 - Dominez votre lane"
          maxLength={100}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="patch">Version du patch</Label>
          <Select
            value={patchVersion}
            onValueChange={setPatchVersion}
          >
            <SelectTrigger id="patch">
              <SelectValue placeholder="Sélectionner une version" />
            </SelectTrigger>
            <SelectContent>
              {availableVersions.map((version) => (
                <SelectItem key={version} value={version}>
                  Patch {version.replace(".1", "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="introduction">Introduction</Label>
        <Textarea
          id="introduction"
          value={introduction}
          onChange={(e) => setIntroduction(e.target.value)}
          placeholder="Présentez votre guide et ce qui le rend unique..."
          rows={4}
          maxLength={2000}
        />
      </div>
    </CardContent>
  </Card>
);

"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";

// Dynamic imports for heavy build-tool components
const ChampionSelector = dynamic(
  () => import("@/components/build-tools").then((mod) => mod.ChampionSelector),
  { ssr: false, loading: () => <Skeleton className="h-12 w-full" /> }
);
const ItemSelector = dynamic(
  () => import("@/components/build-tools").then((mod) => mod.ItemSelector),
  { ssr: false, loading: () => <Skeleton className="h-32 w-full" /> }
);
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
import {
  ArrowLeftIcon,
  SaveIcon,
  Loader2Icon,
  SwordIcon,
  ZapIcon,
  ShieldIcon,
  LightbulbIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCreateGuide } from "@/lib/hooks/use-guide";
import { useApiSWR, STATIC_DATA_CONFIG } from "@/lib/hooks/swr";
import { toast } from "sonner";

interface VersionsResponse {
  success: boolean;
  data: string[];
}
import type {
  CreateGuideRequest,
  ItemBuildConfig,
  SkillOrderConfig,
  RuneConfig,
  GuideRole,
} from "@/types/guides";

// Loading fallback for Suspense
const CreateGuideLoading = () => (
  <div className="container mx-auto px-4 py-8 space-y-6">
    <div className="flex items-center gap-4">
      <Skeleton className="h-9 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  </div>
);

const ROLES: { value: GuideRole; label: string }[] = [
  { value: "TOP", label: "Top" },
  { value: "JUNGLE", label: "Jungle" },
  { value: "MID", label: "Mid" },
  { value: "ADC", label: "ADC" },
  { value: "SUPPORT", label: "Support" },
];

// Suggestions de points forts pré-définies
const STRENGTH_SUGGESTIONS = [
  "Bon waveclear",
  "Fort en 1v1",
  "Excellent engage",
  "Très mobile",
  "Bon sustain",
  "Fort en late game",
  "Burst élevé",
  "Bon poke",
  "Bon split push",
  "Forte pression de map",
  "Bon pour les objectifs",
  "Contrôle de zone",
  "CC puissant",
  "Bon scaling",
  "Fort en teamfight",
];

// Suggestions de points faibles pré-définies
const WEAKNESS_SUGGESTIONS = [
  "Vulnérable aux ganks",
  "Faible early game",
  "Peu mobile",
  "Dépendant des items",
  "Faible contre les tanks",
  "Vulnérable au CC",
  "Difficile à maîtriser",
  "Faible waveclear",
  "Mauvais objectifs",
  "Peu de sustain",
  "Vulnérable au poke",
  "Team dépendant",
  "Facilement kité",
  "Mana dépendant",
  "Faible contre les assassins",
];

const CreateGuideContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { createGuide } = useCreateGuide();

  // Fetch available patch versions
  const { data: versionsData } = useApiSWR<VersionsResponse>(
    "/api/versions",
    STATIC_DATA_CONFIG
  );
  const availableVersions = versionsData?.data ?? [];

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get champion from URL if provided
  const initialChampion = searchParams.get("champion");

  // Form state
  const [championId, setChampionId] = useState<string | null>(initialChampion);

  // Update championId if URL param changes
  useEffect(() => {
    if (initialChampion && !championId) {
      setChampionId(initialChampion);
    }
  }, [initialChampion, championId]);
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<GuideRole | "">("");
  const [introduction, setIntroduction] = useState("");
  const [patchVersion, setPatchVersion] = useState("");

  // Item build
  const [starterItems, setStarterItems] = useState<string[]>([]);
  const [coreItems, setCoreItems] = useState<string[]>([]);
  const [situationalItems, setSituationalItems] = useState<string[]>([]);
  const [bootsItems, setBootsItems] = useState<string[]>([]);

  // Skill order
  const [skillOrder, setSkillOrder] = useState<SkillOrderConfig>({
    levels: {},
    maxOrder: [],
  });

  // Summoner spells
  const [summonerSpells, setSummonerSpells] = useState<string[]>([]);

  // Runes
  const [runeConfig, setRuneConfig] = useState<RuneConfig | null>(null);

  // Tips
  const [earlyGameTips, setEarlyGameTips] = useState("");
  const [midGameTips, setMidGameTips] = useState("");
  const [lateGameTips, setLateGameTips] = useState("");

  // Strengths & Weaknesses
  const [strengths, setStrengths] = useState<string[]>([""]);
  const [weaknesses, setWeaknesses] = useState<string[]>([""]);

  // Redirect if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
            <p className="text-muted-foreground mb-4">
              Vous devez être connecté pour créer un guide.
            </p>
            <Button asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddStrength = () => {
    if (strengths.length < 5) {
      setStrengths([...strengths, ""]);
    }
  };

  const handleRemoveStrength = (index: number) => {
    setStrengths(strengths.filter((_, i) => i !== index));
  };

  const handleStrengthChange = (index: number, value: string) => {
    const newStrengths = [...strengths];
    newStrengths[index] = value;
    setStrengths(newStrengths);
  };

  const handleAddWeakness = () => {
    if (weaknesses.length < 5) {
      setWeaknesses([...weaknesses, ""]);
    }
  };

  const handleRemoveWeakness = (index: number) => {
    setWeaknesses(weaknesses.filter((_, i) => i !== index));
  };

  const handleWeaknessChange = (index: number, value: string) => {
    const newWeaknesses = [...weaknesses];
    newWeaknesses[index] = value;
    setWeaknesses(newWeaknesses);
  };

  const handleAddStrengthSuggestion = (suggestion: string) => {
    // Don't add if already at max or already exists
    if (strengths.length >= 5 || strengths.includes(suggestion)) return;
    // Replace empty first entry or add new
    if (strengths.length === 1 && strengths[0] === "") {
      setStrengths([suggestion]);
    } else {
      setStrengths([...strengths, suggestion]);
    }
  };

  const handleAddWeaknessSuggestion = (suggestion: string) => {
    // Don't add if already at max or already exists
    if (weaknesses.length >= 5 || weaknesses.includes(suggestion)) return;
    // Replace empty first entry or add new
    if (weaknesses.length === 1 && weaknesses[0] === "") {
      setWeaknesses([suggestion]);
    } else {
      setWeaknesses([...weaknesses, suggestion]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!championId) {
      toast.error("Veuillez sélectionner un champion");
      return;
    }

    if (!title.trim()) {
      toast.error("Veuillez entrer un titre");
      return;
    }

    setIsSubmitting(true);

    try {
      const itemBuild: ItemBuildConfig = {
        starter: starterItems,
        core: coreItems,
        situational: situationalItems,
        boots: bootsItems,
      };

      const data: CreateGuideRequest = {
        championId,
        title: title.trim(),
        role: role || undefined,
        introduction: introduction.trim() || undefined,
        patchVersion: patchVersion.trim() || undefined,
        itemBuild:
          starterItems.length > 0 ||
          coreItems.length > 0 ||
          situationalItems.length > 0 ||
          bootsItems.length > 0
            ? itemBuild
            : undefined,
        skillOrder:
          Object.keys(skillOrder.levels).length > 0 || skillOrder.maxOrder.length > 0
            ? skillOrder
            : undefined,
        summonerSpells:
          summonerSpells.length === 2
            ? (summonerSpells as [string, string])
            : undefined,
        runeConfig: runeConfig ?? undefined,
        earlyGameTips: earlyGameTips.trim() || undefined,
        midGameTips: midGameTips.trim() || undefined,
        lateGameTips: lateGameTips.trim() || undefined,
        strengths: strengths.filter((s) => s.trim()).length > 0
          ? strengths.filter((s) => s.trim())
          : undefined,
        weaknesses: weaknesses.filter((w) => w.trim()).length > 0
          ? weaknesses.filter((w) => w.trim())
          : undefined,
        status: "published",
      };

      const guide = await createGuide(data);
      toast.success("Guide créé avec succès !");
      router.push(`/guides/${guide.id}`);
    } catch (error) {
      console.error("Error creating guide:", error);
      toast.error("Erreur lors de la création du guide");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/guides">
              <ArrowLeftIcon className="size-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Créer un guide</h1>
            <p className="text-muted-foreground">
              Partagez votre expertise avec la communauté
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
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

        {/* Item Build */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SwordIcon className="size-5" />
              Build Items
            </CardTitle>
            <CardDescription>
              Définissez l'ordre des items à acheter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ItemSelector
              label="Items de départ"
              selectedItems={starterItems}
              onItemsChange={setStarterItems}
              maxItems={3}
              placeholder="Ajouter un item de départ"
              starterOnly
              dialogTitle="Sélectionner un item de départ"
            />

            <Separator />

            <ItemSelector
              label="Items core"
              selectedItems={coreItems}
              onItemsChange={setCoreItems}
              maxItems={4}
              placeholder="Ajouter un item core"
              completedOnly
              dialogTitle="Sélectionner un item core"
            />

            <Separator />

            <ItemSelector
              label="Items situationnels"
              selectedItems={situationalItems}
              onItemsChange={setSituationalItems}
              maxItems={6}
              placeholder="Ajouter un item situationnel"
              completedOnly
              dialogTitle="Sélectionner un item situationnel"
            />

            <Separator />

            <ItemSelector
              label="Bottes"
              selectedItems={bootsItems}
              onItemsChange={setBootsItems}
              maxItems={2}
              placeholder="Ajouter des bottes"
              filterTag="Boots"
              dialogTitle="Sélectionner des bottes"
            />
          </CardContent>
        </Card>

        {/* Skill Order & Summoner Spells */}
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

        {/* Strengths & Weaknesses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldIcon className="size-5" />
              Points forts et faibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Strengths */}
              <div className="space-y-3">
                <Label className="text-win">Points forts</Label>
                {strengths.map((strength, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={strength}
                      onChange={(e) => handleStrengthChange(index, e.target.value)}
                      placeholder="Ex: Bon waveclear"
                      maxLength={200}
                    />
                    {strengths.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveStrength(index)}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {strengths.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddStrength}
                  >
                    <PlusIcon className="size-4 mr-1" />
                    Ajouter
                  </Button>
                )}
                {/* Suggestions */}
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Suggestions :</p>
                  <div className="flex flex-wrap gap-1">
                    {STRENGTH_SUGGESTIONS.filter(s => !strengths.includes(s)).slice(0, 8).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleAddStrengthSuggestion(suggestion)}
                        disabled={strengths.length >= 5}
                        className="text-xs px-2 py-1 rounded-full bg-win/10 text-win hover:bg-win/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Weaknesses */}
              <div className="space-y-3">
                <Label className="text-loss">Points faibles</Label>
                {weaknesses.map((weakness, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={weakness}
                      onChange={(e) => handleWeaknessChange(index, e.target.value)}
                      placeholder="Ex: Vulnérable aux ganks"
                      maxLength={200}
                    />
                    {weaknesses.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveWeakness(index)}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {weaknesses.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddWeakness}
                  >
                    <PlusIcon className="size-4 mr-1" />
                    Ajouter
                  </Button>
                )}
                {/* Suggestions */}
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Suggestions :</p>
                  <div className="flex flex-wrap gap-1">
                    {WEAKNESS_SUGGESTIONS.filter(s => !weaknesses.includes(s)).slice(0, 8).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleAddWeaknessSuggestion(suggestion)}
                        disabled={weaknesses.length >= 5}
                        className="text-xs px-2 py-1 rounded-full bg-loss/10 text-loss hover:bg-loss/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gameplay Tips */}
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

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/guides">Annuler</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || !championId || !title.trim()}>
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 mr-2 animate-spin" />
                Publication...
              </>
            ) : (
              <>
                <SaveIcon className="size-4 mr-2" />
                Publier le guide
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Wrap in Suspense for useSearchParams
const CreateGuidePage = () => (
  <Suspense fallback={<CreateGuideLoading />}>
    <CreateGuideContent />
  </Suspense>
);

export default CreateGuidePage;

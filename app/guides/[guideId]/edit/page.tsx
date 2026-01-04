"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ChampionSelector,
  ItemSelector,
  SkillOrderEditor,
  SummonerSpellSelector,
  RuneSelector,
} from "@/components/build-tools";
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
import { useGuide, useUpdateGuide } from "@/lib/hooks/use-guide";
import { useApiSWR, STATIC_DATA_CONFIG } from "@/lib/hooks/swr";
import { toast } from "sonner";

interface VersionsResponse {
  success: boolean;
  data: string[];
}
import type {
  UpdateGuideRequest,
  ItemBuildConfig,
  SkillOrderConfig,
  RuneConfig,
  GuideRole,
} from "@/types/guides";

const ROLES: { value: GuideRole; label: string }[] = [
  { value: "TOP", label: "Top" },
  { value: "JUNGLE", label: "Jungle" },
  { value: "MID", label: "Mid" },
  { value: "ADC", label: "ADC" },
  { value: "SUPPORT", label: "Support" },
];

const EditGuidePage = () => {
  const router = useRouter();
  const params = useParams();
  const guideId = params.guideId as string;

  const { user, isLoading: authLoading } = useAuth();
  const { guide, isLoading: guideLoading } = useGuide(guideId);
  const { updateGuide } = useUpdateGuide();

  // Fetch available patch versions
  const { data: versionsData } = useApiSWR<VersionsResponse>(
    "/api/versions",
    STATIC_DATA_CONFIG
  );
  const availableVersions = versionsData?.data ?? [];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Form state
  const [championId, setChampionId] = useState<string | null>(null);
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

  // Initialize form with guide data
  useEffect(() => {
    if (guide && !initialized) {
      setChampionId(guide.championId);
      setTitle(guide.title);
      setRole((guide.role as GuideRole) || "");
      setIntroduction(guide.introduction || "");
      setPatchVersion(guide.patchVersion || "");

      // Item build
      if (guide.itemBuild) {
        setStarterItems(guide.itemBuild.starter || []);
        setCoreItems(guide.itemBuild.core || []);
        setSituationalItems(guide.itemBuild.situational || []);
        setBootsItems(guide.itemBuild.boots || []);
      }

      // Skill order
      if (guide.skillOrder) {
        setSkillOrder(guide.skillOrder);
      }

      // Summoner spells
      if (guide.summonerSpells) {
        setSummonerSpells(guide.summonerSpells);
      }

      // Runes
      if (guide.runeConfig) {
        setRuneConfig(guide.runeConfig);
      }

      // Tips
      setEarlyGameTips(guide.earlyGameTips || "");
      setMidGameTips(guide.midGameTips || "");
      setLateGameTips(guide.lateGameTips || "");

      // Strengths & Weaknesses
      setStrengths(guide.strengths?.length ? guide.strengths : [""]);
      setWeaknesses(guide.weaknesses?.length ? guide.weaknesses : [""]);

      setInitialized(true);
    }
  }, [guide, initialized]);

  // Check authorization
  if (!authLoading && !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Connexion requise</h2>
            <p className="text-muted-foreground mb-4">
              Vous devez être connecté pour modifier un guide.
            </p>
            <Button asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (guideLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Guide non trouvé</h2>
            <p className="text-muted-foreground mb-4">
              Ce guide n&apos;existe pas ou a été supprimé.
            </p>
            <Button asChild>
              <Link href="/guides">Retour aux guides</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check ownership
  if (user && guide.authorId !== user.id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Accès refusé</h2>
            <p className="text-muted-foreground mb-4">
              Vous ne pouvez modifier que vos propres guides.
            </p>
            <Button asChild>
              <Link href={`/guides/${guideId}`}>Voir le guide</Link>
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

      const data: UpdateGuideRequest = {
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
      };

      await updateGuide(guideId, data);
      toast.success("Guide mis à jour avec succès !");
      router.push(`/guides/${guideId}`);
    } catch (error) {
      console.error("Error updating guide:", error);
      toast.error("Erreur lors de la mise à jour du guide");
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
            <Link href={`/guides/${guideId}`}>
              <ArrowLeftIcon className="size-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Modifier le guide</h1>
            <p className="text-muted-foreground">
              Mettez à jour votre guide
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
              Définissez l&apos;ordre des items à acheter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ItemSelector
              label="Items de départ"
              selectedItems={starterItems}
              onItemsChange={setStarterItems}
              maxItems={3}
              placeholder="Ajouter un item de départ"
            />

            <Separator />

            <ItemSelector
              label="Items core"
              selectedItems={coreItems}
              onItemsChange={setCoreItems}
              maxItems={4}
              placeholder="Ajouter un item core"
            />

            <Separator />

            <ItemSelector
              label="Items situationnels"
              selectedItems={situationalItems}
              onItemsChange={setSituationalItems}
              maxItems={6}
              placeholder="Ajouter un item situationnel"
            />

            <Separator />

            <ItemSelector
              label="Bottes"
              selectedItems={bootsItems}
              onItemsChange={setBootsItems}
              maxItems={2}
              placeholder="Ajouter des bottes"
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
              Définissez l&apos;ordre des compétences et les sorts d&apos;invocateur
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
                <Label className="text-green-500">Points forts</Label>
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
              </div>

              {/* Weaknesses */}
              <div className="space-y-3">
                <Label className="text-red-500">Points faibles</Label>
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
            <Link href={`/guides/${guideId}`}>Annuler</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || !championId || !title.trim()}>
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <SaveIcon className="size-4 mr-2" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditGuidePage;

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useCreateGuide } from "@/lib/hooks/use-guide";
import { toast } from "sonner";
import type {
  CreateGuideRequest,
  ItemBuildConfig,
  SkillOrderConfig,
  GuideRole,
} from "@/types/guides";

const ROLES: { value: GuideRole; label: string }[] = [
  { value: "TOP", label: "Top" },
  { value: "JUNGLE", label: "Jungle" },
  { value: "MID", label: "Mid" },
  { value: "ADC", label: "ADC" },
  { value: "SUPPORT", label: "Support" },
];

const CreateGuidePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { createGuide } = useCreateGuide();

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
                <Input
                  id="patch"
                  value={patchVersion}
                  onChange={(e) => setPatchVersion(e.target.value)}
                  placeholder="Ex: 14.10"
                  maxLength={20}
                />
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

        {/* Skill Order */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ZapIcon className="size-5" />
              Ordre des compétences
            </CardTitle>
            <CardDescription>
              Définissez l'ordre d'amélioration des compétences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SkillOrderEditor value={skillOrder} onChange={setSkillOrder} />
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

export default CreateGuidePage;

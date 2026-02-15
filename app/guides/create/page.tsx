"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftIcon, HomeIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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

import { GuideMetadataForm } from "./GuideMetadataForm";
import { GuideBuildSection } from "./GuideBuildSection";
import { GuideSkillsAndSpells } from "./GuideSkillsAndSpells";
import { GuideStrengthsWeaknesses } from "./GuideStrengthsWeaknesses";
import { GuideGameplayTips } from "./GuideGameplayTips";
import { GuideFormActions } from "./GuideFormActions";

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
          <CardContent className="px-8 text-center">
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
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/"><HomeIcon className="size-4" /></Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/guides">Guides</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Creer</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
        <GuideMetadataForm
          championId={championId}
          setChampionId={setChampionId}
          role={role}
          setRole={setRole}
          title={title}
          setTitle={setTitle}
          patchVersion={patchVersion}
          setPatchVersion={setPatchVersion}
          availableVersions={availableVersions}
          introduction={introduction}
          setIntroduction={setIntroduction}
        />

        <GuideBuildSection
          starterItems={starterItems}
          setStarterItems={setStarterItems}
          coreItems={coreItems}
          setCoreItems={setCoreItems}
          situationalItems={situationalItems}
          setSituationalItems={setSituationalItems}
          bootsItems={bootsItems}
          setBootsItems={setBootsItems}
        />

        <GuideSkillsAndSpells
          skillOrder={skillOrder}
          setSkillOrder={setSkillOrder}
          summonerSpells={summonerSpells}
          setSummonerSpells={setSummonerSpells}
          runeConfig={runeConfig}
          setRuneConfig={setRuneConfig}
        />

        <GuideStrengthsWeaknesses
          strengths={strengths}
          setStrengths={setStrengths}
          weaknesses={weaknesses}
          setWeaknesses={setWeaknesses}
        />

        <GuideGameplayTips
          earlyGameTips={earlyGameTips}
          setEarlyGameTips={setEarlyGameTips}
          midGameTips={midGameTips}
          setMidGameTips={setMidGameTips}
          lateGameTips={lateGameTips}
          setLateGameTips={setLateGameTips}
        />

        <GuideFormActions
          isSubmitting={isSubmitting}
          disabled={isSubmitting || !championId || !title.trim()}
        />
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

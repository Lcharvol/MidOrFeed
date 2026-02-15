"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionIcon } from "@/components/ChampionIcon";
import {
  ArrowLeftIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  CalendarIcon,
  UserIcon,
} from "lucide-react";
import { useGuide, useDeleteGuide } from "@/lib/hooks/use-guide";
import { useGuideVote } from "@/lib/hooks/use-champion-guides";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { ItemBuildSection } from "./components/ItemBuildSection";
import { SkillOrderSection } from "./components/SkillOrderSection";
import { GameplayTipsSection } from "./components/GameplayTipsSection";
import { StrengthsWeaknessesSection } from "./components/StrengthsWeaknessesSection";
import { VoteButton } from "./components/VoteButton";
import { GuideComments } from "./components/GuideComments";
import { formatRelativeDate } from "@/lib/format-date";

const GuidePage = () => {
  const params = useParams();
  const router = useRouter();
  const guideId = typeof params?.guideId === "string" ? params.guideId : null;

  const { guide, isLoading, error, revalidate } = useGuide(guideId);
  const { vote } = useGuideVote();
  const { deleteGuide } = useDeleteGuide();
  const { user } = useAuth();

  const handleVote = async (value: -1 | 0 | 1) => {
    if (!guideId) return;
    try {
      await vote(guideId, value);
      revalidate();
      toast.success("Vote enregistré");
    } catch {
      toast.error("Erreur lors du vote");
    }
  };

  const handleDelete = async () => {
    if (!guideId) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce guide ?")) return;

    try {
      await deleteGuide(guideId);
      toast.success("Guide supprimé");
      router.push("/guides");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardContent>
            <div className="flex gap-6">
              <Skeleton className="size-24 rounded-lg" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="px-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Guide non trouvé</h2>
            <p className="text-muted-foreground mb-4">
              Ce guide n'existe pas ou a été supprimé.
            </p>
            <Button asChild>
              <Link href="/guides">
                <ArrowLeftIcon className="size-4 mr-2" />
                Retour aux guides
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/guides">
          <ArrowLeftIcon className="size-4 mr-2" />
          Retour aux guides
        </Link>
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:gap-6 sm:flex-row">
            {/* Champion icon */}
            <div className="shrink-0 flex items-start gap-4 sm:block">
              <ChampionIcon championId={guide.championId} size={64} className="sm:size-24" />
              {/* Mobile: show badges next to icon */}
              <div className="flex flex-col gap-1 sm:hidden">
                <h1 className="text-lg font-bold line-clamp-2">{guide.title}</h1>
                <div className="flex flex-wrap gap-1">
                  {guide.role && <Badge className="text-xs">{guide.role}</Badge>}
                  {guide.status === "draft" && (
                    <Badge variant="secondary" className="text-xs">Brouillon</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Desktop title */}
              <div className="hidden sm:flex flex-wrap items-start gap-2 mb-2">
                <h1 className="text-2xl font-bold">{guide.title}</h1>
                {guide.role && <Badge>{guide.role}</Badge>}
                {guide.status === "draft" && (
                  <Badge variant="secondary">Brouillon</Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                <span className="flex items-center gap-1">
                  <UserIcon className="size-3 sm:size-4" />
                  {guide.authorName || "Anonyme"}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarIcon className="size-3 sm:size-4" />
                  {formatRelativeDate(guide.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <EyeIcon className="size-3 sm:size-4" />
                  {guide.viewCount}
                </span>
                {guide.patchVersion && (
                  <Badge variant="outline" className="text-xs">Patch {guide.patchVersion}</Badge>
                )}
              </div>

              {guide.introduction && (
                <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
                  {guide.introduction}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 sm:mt-4">
                <VoteButton guide={guide} onVote={handleVote} />

                {guide.canEdit && (
                  <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
                    <Link href={`/guides/${guide.id}/edit`}>
                      <EditIcon className="size-3 sm:size-4 mr-1" />
                      <span className="hidden xs:inline">Modifier</span>
                    </Link>
                  </Button>
                )}

                {guide.canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive text-xs sm:text-sm"
                    onClick={handleDelete}
                  >
                    <TrashIcon className="size-3 sm:size-4 mr-1" />
                    <span className="hidden xs:inline">Supprimer</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content sections */}
      <div className="space-y-6">
        {guide.itemBuild && <ItemBuildSection build={guide.itemBuild} />}

        {guide.skillOrder && <SkillOrderSection skillOrder={guide.skillOrder} />}

        <StrengthsWeaknessesSection
          strengths={guide.strengths}
          weaknesses={guide.weaknesses}
        />

        <GameplayTipsSection
          early={guide.earlyGameTips}
          mid={guide.midGameTips}
          late={guide.lateGameTips}
        />

        {/* Comments Section */}
        <GuideComments guideId={guide.id} />
      </div>
    </div>
  );
};

export default GuidePage;

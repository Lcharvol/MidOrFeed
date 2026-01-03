"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ChampionIcon } from "@/components/ChampionIcon";
import { ItemIcon } from "@/components/ItemIcon";
import {
  ArrowLeftIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  CalendarIcon,
  UserIcon,
  SwordIcon,
  ShieldIcon,
  ZapIcon,
} from "lucide-react";
import { useGuide, useDeleteGuide } from "@/lib/hooks/use-guide";
import { useGuideVote } from "@/lib/hooks/use-champion-guides";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { useState } from "react";
import type { ChampionGuide, ItemBuildConfig, SkillOrderConfig } from "@/types/guides";
import { GuideComments } from "./components/GuideComments";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Item Build Section
const ItemBuildSection = ({ build }: { build: ItemBuildConfig }) => {
  const hasItems =
    build.starter.length > 0 ||
    build.core.length > 0 ||
    build.situational.length > 0 ||
    build.boots.length > 0;

  if (!hasItems) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SwordIcon className="size-5" />
          Build Items
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {build.starter.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Items de départ
            </h4>
            <div className="flex flex-wrap gap-2">
              {build.starter.map((itemId, i) => (
                <ItemIcon key={i} itemId={itemId} size={40} />
              ))}
            </div>
          </div>
        )}

        {build.core.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Items core
            </h4>
            <div className="flex flex-wrap gap-2">
              {build.core.map((itemId, i) => (
                <ItemIcon key={i} itemId={itemId} size={40} />
              ))}
            </div>
          </div>
        )}

        {build.situational.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Items situationnels
            </h4>
            <div className="flex flex-wrap gap-2">
              {build.situational.map((itemId, i) => (
                <ItemIcon key={i} itemId={itemId} size={40} />
              ))}
            </div>
          </div>
        )}

        {build.boots.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Bottes
            </h4>
            <div className="flex flex-wrap gap-2">
              {build.boots.map((itemId, i) => (
                <ItemIcon key={i} itemId={itemId} size={40} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Skill Order Section
const SkillOrderSection = ({ skillOrder }: { skillOrder: SkillOrderConfig }) => {
  const hasData = Object.keys(skillOrder.levels).length > 0 || skillOrder.maxOrder.length > 0;

  if (!hasData) return null;

  const skills = ["Q", "W", "E", "R"] as const;
  const levels = Array.from({ length: 18 }, (_, i) => i + 1);

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <ZapIcon className="size-4 sm:size-5" />
          Ordre des compétences
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {skillOrder.maxOrder.length > 0 && (
          <div className="mb-3 sm:mb-4 px-2 sm:px-0">
            <span className="text-xs sm:text-sm text-muted-foreground">Priorité : </span>
            <span className="font-semibold text-sm sm:text-base">
              {skillOrder.maxOrder.join(" > ")}
            </span>
          </div>
        )}

        {Object.keys(skillOrder.levels).length > 0 && (
          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <table className="text-xs sm:text-sm" style={{ minWidth: "480px" }}>
              <thead>
                <tr>
                  <th className="text-left p-0.5 sm:p-1 w-8 sm:w-12"></th>
                  {levels.map((level) => (
                    <th
                      key={level}
                      className="text-center p-0.5 sm:p-1 w-6 sm:w-8 text-muted-foreground font-normal"
                    >
                      {level}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr key={skill}>
                    <td className="font-semibold p-0.5 sm:p-1">{skill}</td>
                    {levels.map((level) => {
                      const isSelected = skillOrder.levels[level] === skill;
                      return (
                        <td key={level} className="text-center p-0.5 sm:p-1">
                          <div
                            className={`size-4 sm:size-6 rounded mx-auto ${
                              isSelected
                                ? skill === "R"
                                  ? "bg-yellow-500"
                                  : "bg-primary"
                                : "bg-muted"
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Gameplay Tips Section
const GameplayTipsSection = ({
  early,
  mid,
  late,
}: {
  early: string | null;
  mid: string | null;
  late: string | null;
}) => {
  if (!early && !mid && !late) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conseils de jeu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {early && (
          <div>
            <h4 className="font-medium text-sm mb-1">Early Game</h4>
            <p className="text-muted-foreground whitespace-pre-line">{early}</p>
          </div>
        )}
        {mid && (
          <div>
            <h4 className="font-medium text-sm mb-1">Mid Game</h4>
            <p className="text-muted-foreground whitespace-pre-line">{mid}</p>
          </div>
        )}
        {late && (
          <div>
            <h4 className="font-medium text-sm mb-1">Late Game</h4>
            <p className="text-muted-foreground whitespace-pre-line">{late}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Strengths & Weaknesses Section
const StrengthsWeaknessesSection = ({
  strengths,
  weaknesses,
}: {
  strengths: string[] | null;
  weaknesses: string[] | null;
}) => {
  if (!strengths?.length && !weaknesses?.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {strengths && strengths.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-green-500 flex items-center gap-2">
              <ThumbsUpIcon className="size-4" />
              Points forts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {strengths.map((s, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-green-500">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {weaknesses && weaknesses.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-red-500 flex items-center gap-2">
              <ThumbsDownIcon className="size-4" />
              Points faibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {weaknesses.map((w, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-red-500">-</span>
                  {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Vote Button Component
const VoteButton = ({
  guide,
  onVote,
}: {
  guide: ChampionGuide;
  onVote: (value: -1 | 0 | 1) => void;
}) => {
  const { user } = useAuth();
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (value: -1 | 1) => {
    if (!user) {
      toast.error("Connectez-vous pour voter");
      return;
    }
    setIsVoting(true);
    try {
      await onVote(value);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Voter pour ce guide">
      <Button
        variant={guide.viewerVote === 1 ? "default" : "outline"}
        size="sm"
        onClick={() => handleVote(1)}
        disabled={isVoting}
        aria-label={`Vote positif (${guide.upvotes} votes)`}
        aria-pressed={guide.viewerVote === 1}
      >
        <ThumbsUpIcon className="size-4 mr-1" aria-hidden="true" />
        {guide.upvotes}
      </Button>
      <Button
        variant={guide.viewerVote === -1 ? "destructive" : "outline"}
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={isVoting}
        aria-label={`Vote negatif (${guide.downvotes} votes)`}
        aria-pressed={guide.viewerVote === -1}
      >
        <ThumbsDownIcon className="size-4 mr-1" aria-hidden="true" />
        {guide.downvotes}
      </Button>
    </div>
  );
};

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
          <CardContent className="p-6">
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
          <CardContent className="p-8 text-center">
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
        <CardContent className="p-4 sm:p-6">
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
                  {formatDate(guide.createdAt)}
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

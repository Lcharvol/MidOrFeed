"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ThumbsUpIcon,
  ThumbsDownIcon,
  EyeIcon,
  PlusIcon,
  UserIcon,
  CalendarIcon,
} from "lucide-react";
import { useChampionGuides } from "@/lib/hooks/use-champion-guides";
import type { GuideSummary } from "@/types/guides";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
};

const GuideCard = ({ guide }: { guide: GuideSummary }) => {
  const netVotes = guide.upvotes - guide.downvotes;

  return (
    <Link href={`/guides/${guide.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-sm sm:text-base truncate">{guide.title}</h4>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <UserIcon className="size-3" />
                  <span className="truncate max-w-[80px] sm:max-w-none">{guide.authorName || "Anonyme"}</span>
                </span>
                <span className="flex items-center gap-1">
                  <CalendarIcon className="size-3" />
                  {formatDate(guide.createdAt)}
                </span>
                {guide.role && (
                  <Badge variant="secondary" className="text-xs hidden xs:inline-flex">
                    {guide.role}
                  </Badge>
                )}
              </div>
            </div>
            <div
              className={`text-xs sm:text-sm font-bold px-1.5 sm:px-2 py-0.5 rounded shrink-0 ${
                netVotes > 0
                  ? "text-win bg-win/10"
                  : netVotes < 0
                    ? "text-loss bg-loss/10"
                    : "text-muted-foreground bg-muted"
              }`}
            >
              {netVotes > 0 ? `+${netVotes}` : netVotes}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

interface ChampionGuidesSectionProps {
  championId: string;
  championName: string;
}

export const ChampionGuidesSection = ({
  championId,
  championName,
}: ChampionGuidesSectionProps) => {
  const { guides, isLoading } = useChampionGuides(championId, {
    sort: "popular",
    limit: 5,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
      {/* Header with create button */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs sm:text-sm text-muted-foreground">
          {guides.length === 0
            ? `Aucun guide pour ${championName}.`
            : `${guides.length} guide${guides.length > 1 ? "s" : ""}`}
        </p>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href={`/guides/create?champion=${championId}`}>
            <PlusIcon className="size-4 mr-1" />
            Créer un guide
          </Link>
        </Button>
      </div>

      {/* Guides list */}
      {guides.length > 0 && (
        <div className="space-y-2 sm:space-y-3">
          {guides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      )}

      {/* View all link */}
      {guides.length > 0 && (
        <div className="text-center pt-1 sm:pt-2">
          <Button variant="ghost" size="sm" asChild className="text-xs sm:text-sm">
            <Link href={`/guides?championId=${championId}`}>
              Voir tous les guides
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

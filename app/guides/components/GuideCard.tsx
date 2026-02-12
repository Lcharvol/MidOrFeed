"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChampionIcon } from "@/components/ChampionIcon";
import {
  ThumbsUpIcon,
  ThumbsDownIcon,
  EyeIcon,
} from "lucide-react";
import { formatRelativeDate } from "@/lib/format-date";
import type { GuideSummary } from "@/types/guides";

export const GuideCard = ({ guide }: { guide: GuideSummary }) => {
  const netVotes = guide.upvotes - guide.downvotes;

  return (
    <Link href={`/guides/${guide.id}`}>
      <Card variant="interactive" className="h-full">
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-3 sm:gap-4">
            {/* Champion icon */}
            <div className="shrink-0">
              <ChampionIcon championId={guide.championId} size={48} className="sm:size-14" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm sm:text-base truncate">{guide.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    par {guide.authorName || "Anonyme"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {guide.role && (
                    <Badge emphasis="info" emphasisVariant="subtle" className="text-xs hidden xs:inline-flex">
                      {guide.role}
                    </Badge>
                  )}
                  {/* Score - visible on all screens */}
                  <div
                    className={`text-sm sm:text-base font-bold px-2 py-0.5 rounded ${
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
              </div>

              {guide.introduction && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 line-clamp-2 hidden sm:block">
                  {guide.introduction}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1" aria-label={`${guide.upvotes} votes positifs`}>
                  <ThumbsUpIcon className="size-3 sm:size-3.5" aria-hidden="true" />
                  <span>{guide.upvotes}</span>
                </div>
                <div className="flex items-center gap-1" aria-label={`${guide.downvotes} votes negatifs`}>
                  <ThumbsDownIcon className="size-3 sm:size-3.5" aria-hidden="true" />
                  <span>{guide.downvotes}</span>
                </div>
                <div className="flex items-center gap-1" aria-label={`${guide.viewCount} vues`}>
                  <EyeIcon className="size-3 sm:size-3.5" aria-hidden="true" />
                  <span>{guide.viewCount}</span>
                </div>
                <span className="text-muted-foreground/60 hidden sm:inline">
                  {formatRelativeDate(new Date(guide.createdAt).getTime())}
                </span>
                {guide.patchVersion && (
                  <Badge emphasis="neutral" emphasisVariant="subtle" className="text-xs hidden sm:inline-flex">
                    {guide.patchVersion}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SearchIcon, ChevronRightIcon } from "lucide-react";
import { formatRelativeDate } from "@/lib/format-date";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { getProfileIconUrl } from "@/constants/ddragon";
import type { RecentSearch } from "@/lib/hooks/use-recent-search";

interface RecentSearchesProps {
  recentSearches: RecentSearch[];
}

export function RecentSearches({ recentSearches }: RecentSearchesProps) {
  const { t } = useI18n();

  if (recentSearches.length === 0) return null;

  const featured = recentSearches[0];
  const rest = recentSearches.slice(1);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <SearchIcon className="size-5 text-muted-foreground" />
        {t("homeSearch.recentSearches")}
      </h2>

      <div className="space-y-3">
        {/* Most recent — featured */}
        <Card variant="interactive" className="group border-primary/30">
          <CardContent className="px-4">
            <Link
              href={`/summoners/${featured.puuid}/overview?region=${featured.region}`}
              className="flex items-center gap-4"
            >
              <Avatar className="size-14 border-2 border-primary/20">
                {featured.profileIconId ? (
                  <AvatarImage asChild src={getProfileIconUrl(featured.profileIconId)}>
                    <Image
                      src={getProfileIconUrl(featured.profileIconId)}
                      alt=""
                      width={56}
                      height={56}
                    />
                  </AvatarImage>
                ) : null}
                <AvatarFallback className="text-lg">
                  {featured.gameName[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                  {featured.gameName}
                  <span className="text-muted-foreground text-sm ml-1">#{featured.tagLine}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge emphasis="info" emphasisVariant="subtle" className="text-xs">
                    {featured.region.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(featured.timestamp)}
                  </span>
                </div>
              </div>
              <ChevronRightIcon className="size-5 text-muted-foreground shrink-0" />
            </Link>
          </CardContent>
        </Card>

        {/* Older searches — compact grid */}
        {rest.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rest.map((s) => (
              <Card key={`${s.puuid}-${s.region}`} variant="interactive" className="group">
                <CardContent className="px-3">
                  <Link
                    href={`/summoners/${s.puuid}/overview?region=${s.region}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="size-10 border-0">
                      {s.profileIconId ? (
                        <AvatarImage asChild src={getProfileIconUrl(s.profileIconId)}>
                          <Image
                            src={getProfileIconUrl(s.profileIconId)}
                            alt=""
                            width={40}
                            height={40}
                          />
                        </AvatarImage>
                      ) : null}
                      <AvatarFallback className="text-sm">
                        {s.gameName[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {s.gameName}
                        <span className="text-muted-foreground text-xs">#{s.tagLine}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge emphasis="info" emphasisVariant="subtle" className="text-[10px]">
                          {s.region.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeDate(s.timestamp)}
                        </span>
                      </div>
                    </div>
                    <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

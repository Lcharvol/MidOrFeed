"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonAvatar } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { ChampionIcon } from "@/components/ChampionIcon";
import {
  RefreshCwIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

const CAROUSEL_OPTS = { align: "start" as const, slidesToScroll: 5 };

type FreeRotationSectionProps = {
  freeChampionIds: number[];
  rotationLoading: boolean;
  championsListLoading: boolean;
  championKeyToIdMap: Map<string, string>;
  resolveName: (key: string) => string;
};

export const FreeRotationSection = ({
  freeChampionIds,
  rotationLoading,
  championsListLoading,
  championKeyToIdMap,
  resolveName,
}: FreeRotationSectionProps) => {
  const { t } = useI18n();

  return (
    <section className="py-14 md:py-20 bg-gradient-to-b from-muted/30 to-background border-y">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
              <RefreshCwIcon className="size-6 text-primary" />
              Rotation gratuite
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Champions jouables gratuitement cette semaine
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tier-list/champions" className="flex items-center gap-1">
              {t("common.viewAll") ?? "Voir tout"}
              <ChevronRightIcon className="size-4" />
            </Link>
          </Button>
        </div>

        {rotationLoading || championsListLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <SkeletonAvatar size="lg" className="size-14 rounded-xl" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <Carousel opts={CAROUSEL_OPTS} className="mx-12">
            <CarouselContent>
              {freeChampionIds.map((key) => {
                const champId = championKeyToIdMap.get(String(key)) ?? String(key);
                const champName = resolveName(String(key));
                return (
                  <CarouselItem key={key} className="basis-1/4 sm:basis-1/5 md:basis-1/7 lg:basis-1/10">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={`/champions/${encodeURIComponent(champId)}`}
                          className="flex flex-col items-center gap-2 group"
                        >
                          <ChampionIcon
                            championId={champId}
                            size={56}
                            alt={champName}
                            className="group-hover:scale-105 transition-transform"
                          />
                          <span className="text-xs text-muted-foreground truncate max-w-[64px] text-center">
                            {champName}
                          </span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={4}>{champName}</TooltipContent>
                    </Tooltip>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        )}
      </div>
    </section>
  );
};

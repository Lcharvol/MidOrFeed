'use client';

import Image from 'next/image';
import { Loader2Icon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChampionRunes } from '@/lib/hooks/use-champion-runes';
import { useI18n } from '@/lib/i18n-context';
import { cn } from '@/lib/utils';
import { DDRAGON_VERSION } from '@/constants/ddragon';

type ChampionRunesSectionProps = {
  championId: string;
  championName: string;
};

const formatPercentage = (value: number) =>
  `${(value * 100).toFixed(value >= 0.1 ? 1 : 2)}%`;

const formatCount = (value: number) =>
  value.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

const getSummonerSpellImageUrl = (spellId: number) => {
  const spellName = getSummonerSpellName(spellId);
  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/spell/Summoner${spellName}.png`;
};

const getSummonerSpellName = (spellId: number): string => {
  const spellNames: Record<number, string> = {
    1: 'Boost',
    3: 'Exhaust',
    4: 'Flash',
    6: 'Ghost',
    7: 'Heal',
    11: 'Smite',
    12: 'Teleport',
    13: 'Clarity',
    14: 'Ignite',
    21: 'Barrier',
    30: 'PoroRecall',
    31: 'PoroThrow',
    32: 'Mark',
    39: 'Mark',
    54: 'Cleanse',
    55: 'ProwlersClaw',
    2201: 'Flash',
    2202: 'Teleport',
  };
  return spellNames[spellId] || 'Flash';
};

const LoadingState = () => {
  const { t } = useI18n();
  return (
    <Card>
      <CardContent className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2Icon className="size-5 animate-spin" />
        <span>{t("championDetails.runesLoading")}</span>
      </CardContent>
    </Card>
  );
};

const ErrorState = ({ message }: { message: string }) => {
  const { t } = useI18n();
  return (
    <Card className="border-red-500/40 bg-red-500/10">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-red-600">
          {t("championDetails.runesError")}
        </CardTitle>
        <CardDescription className="text-sm text-red-600/80">
          {message}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

const EmptyState = ({ championName }: { championName: string }) => {
  const { t } = useI18n();
  return (
    <Card className="border-amber-500/40 bg-amber-500/10">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-amber-700">
          {t("championDetails.runesInsufficientData")}
        </CardTitle>
        <CardDescription className="text-sm text-amber-700/80">
          {t("championDetails.runesInsufficientDataDesc").replace("{championName}", championName)}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export const ChampionRunesSection = ({
  championId,
  championName,
}: ChampionRunesSectionProps) => {
  const { t } = useI18n();
  const { runesData, isLoading, error } = useChampionRunes(championId);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={String(error)} />;
  }

  if (!runesData || runesData.totalMatches === 0) {
    return <EmptyState championName={championName} />;
  }

  return (
    <div className="space-y-6">
      {/* Sorts d'invocateur */}
      {runesData.summonerSpells.length > 0 && (
        <Card className="border border-border/60 bg-background/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              {t("championDetails.summonerSpellsTitle").replace("{championName}", championName)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {runesData.summonerSpells.map((spell, index) => (
              <div
                key={`${spell.spell1Id}-${spell.spell2Id}`}
                className={cn(
                  'flex items-center justify-between rounded-lg border border-border/60 bg-background/60 p-3',
                  index === 0 && 'ring-2 ring-primary/20'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="relative size-8 overflow-hidden rounded border border-border/60 bg-background/80">
                      <Image
                        src={getSummonerSpellImageUrl(spell.spell1Id)}
                        alt={spell.spell1Name}
                        width={32}
                        height={32}
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          // Fallback si l'image ne charge pas
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="relative size-8 overflow-hidden rounded border border-border/60 bg-background/80">
                      <Image
                        src={getSummonerSpellImageUrl(spell.spell2Id)}
                        alt={spell.spell2Name}
                        width={32}
                        height={32}
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          // Fallback si l'image ne charge pas
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {spell.spell1Name} + {spell.spell2Name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCount(spell.picks)} {t("championDetails.games")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatPercentage(spell.pickRate)}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("championDetails.selection")}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        spell.winRate >= 0.5
                          ? 'text-emerald-500'
                          : 'text-rose-500'
                      )}
                    >
                      {formatPercentage(spell.winRate)}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("championDetails.victory")}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Runes - Placeholder pour l'instant */}
      <Card className="border border-border/60 bg-background/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            {t("championDetails.runesTitle").replace("{championName}", championName)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            {t("championDetails.runesComingSoon")}
          </div>
        </CardContent>
      </Card>

      {/* Ordre des compétences - Placeholder pour l'instant */}
      <Card className="border border-border/60 bg-background/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            {t("championDetails.skillOrderTitle").replace("{championName}", championName)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            {t("championDetails.skillOrderComingSoon")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


'use client';

import Image from 'next/image';
import DOMPurify from 'dompurify';
import { ChampionAbility } from '@/lib/champions/get-champion-abilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorBadge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n-context';

const badgeEmphasisBySlot: Record<string, 'neutral' | 'info' | 'positive' | 'warning' | 'danger'> = {
  P: 'neutral',
  Q: 'info',
  W: 'info',
  E: 'info',
  R: 'positive',
};

type ChampionAbilitiesSectionProps = {
  abilities: ChampionAbility[];
  championName: string;
};

export const ChampionAbilitiesSection = ({
  abilities,
  championName,
}: ChampionAbilitiesSectionProps) => {
  const { t } = useI18n();

  const slotLabels: Record<string, string> = {
    P: t("abilities.passive"),
    Q: 'Q',
    W: 'W',
    E: 'E',
    R: 'R',
  };

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            {t("abilities.title")} — {championName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {abilities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("abilities.noData")}
            </p>
          ) : (
            abilities.map((ability) => (
              <div
                key={`${ability.slot}-${ability.name}`}
                className="flex flex-col gap-4 rounded-lg border border-border/60 bg-background/80 p-4 shadow-sm sm:flex-row sm:items-start"
              >
                <div className="flex items-start gap-3">
                  <Image
                    src={ability.icon}
                    alt={`${championName} ${ability.name}`}
                    width={64}
                    height={64}
                    className="rounded-md border border-border/50 bg-muted p-1"
                  />
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <ColorBadge
                        emphasis={badgeEmphasisBySlot[ability.slot] ?? 'neutral'}
                        variant="subtle"
                      >
                        {slotLabels[ability.slot] ?? ability.slot}
                      </ColorBadge>
                      <p className="text-base font-semibold leading-tight text-foreground">
                        {ability.name}
                      </p>
                    </div>
                    <div
                      className="text-sm leading-relaxed text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ability.description) }}
                    />
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {ability.cooldown ? (
                        <span className="rounded-md bg-muted px-2 py-1">
                          {t("abilities.cooldown")}: {ability.cooldown}
                        </span>
                      ) : null}
                      {ability.cost ? (
                        <span className="rounded-md bg-muted px-2 py-1">
                          {t("abilities.cost")}: {ability.cost}
                        </span>
                      ) : null}
                      {ability.resource && !ability.cost ? (
                        <span className="rounded-md bg-muted px-2 py-1">
                          {t("abilities.resource")}: {ability.resource}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
};

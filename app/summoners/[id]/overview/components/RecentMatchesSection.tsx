'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChampionIcon } from '@/components/ChampionIcon';
import { QUEUE_NAMES } from '@/constants/queues';
import { cn } from '@/lib/utils';

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
};

const formatDate = (timestamp: string | number) => {
  const date = new Date(Number(timestamp));
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export type MatchParticipant = {
  participantId: number;
  participantPUuid: string | null;
  teamId: number;
  championId: string;
  championName?: string | null;
};

type RecentMatchEntry = {
  id: string;
  matchId: string;
  championId: string;
  championSlug: string;
  championKey?: string;
  queueId: number | null;
  gameCreation: string;
  gameDuration: number;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  items?: (number | null)[];
  summoner1Id?: number | null;
  summoner2Id?: number | null;
  role?: string | null;
  lane?: string | null;
  goldEarned?: number;
  visionScore?: number;
  participant?: {
    [key: string]: unknown;
  };
  teamId?: number;
  participants?: MatchParticipant[];
};

export type { RecentMatchEntry };

type RecentMatchesSectionProps = {
  matches: RecentMatchEntry[];
  championNameMap: Map<string, string>;
  championKeyToId: Map<string, string>;
};

export const RecentMatchesSection = ({
  matches,
  championNameMap,
  championKeyToId,
}: RecentMatchesSectionProps) => {
  if (matches.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/70 bg-background/90 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Dernières parties
        </CardTitle>
        <CardDescription className="text-xs">
          Résumé rapide de vos matchs les plus récents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {matches.map((match) => {
          const championName = championNameMap.get(match.championId) ?? match.championId;
          const queueLabel =
            match.queueId !== null && match.queueId !== undefined
              ? QUEUE_NAMES[match.queueId] ?? `Queue ${match.queueId}`
              : 'File inconnue';
          const kdaLabel = `${match.kills}/${match.deaths}/${match.assists}`;

          return (
            <div
              key={match.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-2.5"
            >
              <ChampionIcon
                championId={match.championSlug}
                championKey={match.championKey ?? match.championId}
                championKeyToId={championKeyToId}
                size={36}
                shape="rounded"
                className="rounded-lg border border-border/50"
              />
              <div className="flex min-w-[120px] flex-col">
                <span className="text-sm font-semibold text-foreground">{championName}</span>
                <span className="text-xs text-muted-foreground">{kdaLabel} KDA</span>
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span>{formatDate(match.gameCreation)}</span>
                <span>·</span>
                <span>{queueLabel}</span>
                <span>·</span>
                <span>{formatDuration(match.gameDuration)}</span>
              </div>
              <Badge
                className={cn(
                  'px-2.5 py-1 text-[11px] font-semibold uppercase',
                  match.win
                    ? 'bg-emerald-500 text-white hover:bg-emerald-500'
                    : 'bg-rose-500 text-white hover:bg-rose-500'
                )}
              >
                {match.win ? 'Victoire' : 'Défaite'}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

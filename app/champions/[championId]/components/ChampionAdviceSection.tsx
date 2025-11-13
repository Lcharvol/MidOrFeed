'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ThumbsDownIcon,
  ThumbsUpIcon,
  Loader2Icon,
  MessageSquareIcon,
  ClockIcon,
  ArrowUpNarrowWideIcon,
  LanguagesIcon,
  Trash2Icon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useChampionAdvice } from '@/lib/hooks/use-champion-advice';
import { apiKeys } from '@/lib/api/keys';
import type { ChampionAdviceEntry } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { DDRAGON_VERSION } from '@/constants/ddragon';

type ChampionAdviceSectionProps = {
  championId: string;
  championName: string;
};

const relativeTimeFormatter = new Intl.RelativeTimeFormat('fr', {
  numeric: 'auto',
});

const getRelativeTime = (isoDate: string) => {
  const timestamp = new Date(isoDate).getTime();
  const now = Date.now();
  const diff = timestamp - now;
  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (Math.abs(days) >= 1) {
    return relativeTimeFormatter.format(days, 'day');
  }
  if (Math.abs(hours) >= 1) {
    return relativeTimeFormatter.format(hours, 'hour');
  }
  if (Math.abs(minutes) >= 1) {
    return relativeTimeFormatter.format(minutes, 'minute');
  }
  return relativeTimeFormatter.format(seconds, 'second');
};

const AdviceVoteButton = ({
  icon,
  active,
  disabled,
  label,
  onClick,
}: {
  icon: 'up' | 'down';
  active: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    disabled={disabled}
    onClick={onClick}
    className={[
      'size-9 rounded-full border border-transparent bg-background/60 p-0 transition hover:border-border/60 hover:bg-background',
      active && icon === 'up'
        ? 'text-emerald-500 hover:text-emerald-500'
        : '',
      active && icon === 'down'
        ? 'text-rose-500 hover:text-rose-500'
        : '',
    ]
      .filter(Boolean)
      .join(' ')}
    aria-label={label}
  >
    {icon === 'up' ? (
      <ThumbsUpIcon className="size-4" aria-hidden="true" />
    ) : (
      <ThumbsDownIcon className="size-4" aria-hidden="true" />
    )}
  </Button>
);

const AdviceCard = ({
  advice,
  onVote,
  pending,
  onDelete,
  canDelete,
  deletePending,
}: {
  advice: ChampionAdviceEntry;
  onVote: (adviceId: string, value: -1 | 1) => void;
  pending: boolean;
  onDelete: (adviceId: string) => void;
  canDelete: boolean;
  deletePending: boolean;
}) => {
  const voteSummary = useMemo(
    () => ({
      isUpvoted: advice.viewerVote === 1,
      isDownvoted: advice.viewerVote === -1,
    }),
    [advice.viewerVote]
  );

  const languageLabel = advice.language ?? 'Langue inconnue';
  const versionLabel = advice.patchVersion ?? 'non précisé';

  return (
    <div className="flex gap-4 rounded-2xl border border-border/50 bg-background/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex w-14 flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-background/90 py-4">
        <AdviceVoteButton
          icon="up"
          label="Upvote"
          active={voteSummary.isUpvoted}
          disabled={pending}
          onClick={() => onVote(advice.id, 1)}
        />
        <span
          className={[
            'text-sm font-semibold',
            advice.score > 0
              ? 'text-emerald-500'
              : advice.score < 0
                ? 'text-rose-500'
                : 'text-muted-foreground',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {advice.score > 0 ? `+${advice.score}` : advice.score}
        </span>
        <AdviceVoteButton
          icon="down"
          label="Downvote"
          active={voteSummary.isDownvoted}
          disabled={pending}
          onClick={() => onVote(advice.id, -1)}
        />
      </div>
      <div className="flex-1 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">
              {advice.authorName ?? 'Invité'}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="size-3.5" aria-hidden="true" />
                Posté {getRelativeTime(advice.createdAt)}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <LanguagesIcon className="size-3.5" aria-hidden="true" />
                {languageLabel}
              </span>
              <span>•</span>
              <span>Patch {versionLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
              {advice.upvotes} upvote{advice.upvotes > 1 ? 's' : ''} · {advice.downvotes} downvote
              {advice.downvotes > 1 ? 's' : ''}
            </Badge>
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={deletePending}
                onClick={() => onDelete(advice.id)}
                className="text-xs text-muted-foreground hover:text-rose-500"
              >
                {deletePending ? (
                  <>
                    <Loader2Icon className="mr-1 size-3.5 animate-spin" />
                    Suppression…
                  </>
                ) : (
                  <>
                    <Trash2Icon className="mr-1 size-3.5" />
                    Supprimer
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
          {advice.content}
        </p>
      </div>
    </div>
  );
};

export const ChampionAdviceSection = ({
  championId,
  championName,
}: ChampionAdviceSectionProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const {
    advices,
    isLoading,
    error,
    mutate,
    validateSingle,
  } = useChampionAdvice(championId);

  const [content, setContent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingVoteId, setPendingVoteId] = useState<string | null>(null);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<'popular' | 'recent'>('popular');
  const [onlyMyLanguage, setOnlyMyLanguage] = useState(false);
  const [onlyCurrentPatch, setOnlyCurrentPatch] = useState(false);

  const userLanguage = useMemo(() => {
    if (typeof window === 'undefined') {
      return 'fr';
    }
    return window.navigator.language?.split('-')[0].toLowerCase() ?? 'fr';
  }, []);

  const filteredAndSortedAdvices = useMemo(() => {
    const targetPatchPrefix = DDRAGON_VERSION.split('.').slice(0, 2).join('.');
    const filtered = advices.filter((advice) => {
      const adviceLanguage = advice.language?.toLowerCase() ?? null;
      const matchesLanguage = !onlyMyLanguage
        ? true
        : adviceLanguage
          ? adviceLanguage === userLanguage
          : false;

      const matchesPatch = !onlyCurrentPatch
        ? true
        : advice.patchVersion
          ? advice.patchVersion.startsWith(targetPatchPrefix)
          : false;

      return matchesLanguage && matchesPatch;
    });

    const comparator =
      sortKey === 'popular'
        ? (a: ChampionAdviceEntry, b: ChampionAdviceEntry) => {
            if (b.score === a.score) {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return b.score - a.score;
          }
        : (a: ChampionAdviceEntry, b: ChampionAdviceEntry) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

    return [...filtered].sort(comparator);
  }, [advices, onlyCurrentPatch, onlyMyLanguage, sortKey, userLanguage]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!user) {
      const target =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : `/champions/${championId}`;
      router.push(`/login?next=${encodeURIComponent(target)}`);
      return;
    }

    if (!content.trim()) {
      setFormError('Le conseil ne peut pas être vide.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(apiKeys.championAdvice(championId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          championId,
          content: content.trim(),
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error ?? "Impossible d'enregistrer le conseil");
      }

      const validation = validateSingle(json);
      if (!validation.ok) {
        throw new Error(validation.error);
      }

      await mutate?.((current) => {
        if (!current || !('success' in current) || !current.success) {
          return current;
        }
        return {
          success: true,
          data: {
            championId: current.data.championId,
            advices: [validation.value.advice, ...current.data.advices],
          },
        };
      }, { revalidate: false });

      setContent('');
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Une erreur est survenue lors de l'envoi du conseil.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (adviceId: string, value: -1 | 1) => {
    if (!user) {
      setFormError('Connecte-toi pour voter sur les conseils.');
      return;
    }

    setPendingVoteId(adviceId);

    try {
      const response = await fetch(apiKeys.championAdviceVote(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.id}`,
        },
        body: JSON.stringify({
          adviceId,
          value,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error ?? "Impossible de mettre à jour le vote");
      }

      const validation = validateSingle(json);
      if (!validation.ok) {
        throw new Error(validation.error);
      }

      await mutate?.((current) => {
        if (!current || !('success' in current) || !current.success) {
          return current;
        }
        return {
          success: true,
          data: {
            championId: current.data.championId,
            advices: current.data.advices.map((advice) =>
              advice.id === validation.value.advice.id
                ? validation.value.advice
                : advice
            ),
          },
        };
      }, { revalidate: false });
    } catch (voteError) {
      const message =
        voteError instanceof Error
          ? voteError.message
          : 'Une erreur est survenue lors du vote.';
      setFormError(message);
    } finally {
      setPendingVoteId(null);
    }
  };

  const handleDelete = async (adviceId: string) => {
    setFormError(null);
    setDeletePendingId(adviceId);

    try {
      const response = await fetch(`/api/champions/advice/${adviceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: user ? `Bearer ${user.id}` : '',
        },
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json?.success) {
        throw new Error(json?.error ?? 'Impossible de supprimer le conseil');
      }

      await mutate?.((current) => {
        if (!current || !('success' in current) || !current.success) {
          return current;
        }
        return {
          success: true,
          data: {
            championId: current.data.championId,
            advices: current.data.advices.filter((entry) => entry.id !== adviceId),
          },
        };
      }, { revalidate: false });
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : 'Une erreur est survenue lors de la suppression.';
      setFormError(message);
    } finally {
      setDeletePendingId(null);
    }
  };

  const emptyState = (
    <Card className="border-dashed border-border/50 bg-background/70">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center text-sm text-muted-foreground">
        <MessageSquareIcon className="size-6 text-muted-foreground/60" aria-hidden="true" />
        <span>
          Aucun conseil n’a été partagé pour {championName} pour le moment. Sois le premier à raconter
          comment tu domines la Faille !
        </span>
      </CardContent>
    </Card>
  );

  return (
    <section
      aria-labelledby="champion-advice-heading"
      className="space-y-6 rounded-2xl border border-border/60 bg-background/70 p-6 shadow-lg shadow-black/10"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <MessageSquareIcon className="size-5 text-muted-foreground" aria-hidden="true" />
          <h2 id="champion-advice-heading" className="text-lg font-semibold text-foreground">
            Conseils de la communauté
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Partage tes astuces et stratégies pour maîtriser {championName}. Les conseils les plus utiles
          remontent en tête grâce aux votes.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-background/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={sortKey === 'popular' ? 'default' : 'outline'}
              className="flex items-center gap-1"
              onClick={() => setSortKey('popular')}
            >
              <ArrowUpNarrowWideIcon className="size-4" aria-hidden="true" />
              Populaire
            </Button>
            <Button
              type="button"
              size="sm"
              variant={sortKey === 'recent' ? 'default' : 'outline'}
              className="flex items-center gap-1"
              onClick={() => setSortKey('recent')}
            >
              <ClockIcon className="size-4" aria-hidden="true" />
              Récent
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Switch
                checked={onlyMyLanguage}
                onCheckedChange={setOnlyMyLanguage}
                aria-label="Afficher uniquement ma langue"
              />
              Afficher uniquement ma langue
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Switch
                checked={onlyCurrentPatch}
                onCheckedChange={setOnlyCurrentPatch}
                aria-label="Afficher uniquement le patch courant"
              />
              Afficher uniquement le patch {DDRAGON_VERSION}
            </label>
          </div>
        </div>
      </div>

      <Card className="border-border/50 bg-background/80">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Ajouter un conseil
            </CardTitle>
            <CardDescription>
              Décris une astuce concrète, une combinaison efficace ou une situation où {championName} excelle.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={`Partage ton conseil sur ${championName}...`}
              minLength={10}
              maxLength={1000}
              rows={4}
              className="resize-none"
            />
            {formError ? (
              <p className="text-sm font-medium text-rose-500" role="alert">
                {formError}
              </p>
            ) : null}
            {!user ? (
              <p className="text-xs text-muted-foreground">
                Tu dois être connecté pour poster un conseil.
              </p>
            ) : null}
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t border-border/60 bg-muted/10 py-4">
            <span className="text-xs text-muted-foreground">
              Minimum 10 caractères · Maximum 1000 caractères
            </span>
            <Button type="submit" disabled={isSubmitting || !user}>
              {isSubmitting ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Envoi en cours
                </>
              ) : (
                'Publier'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Separator className="bg-border/50" />

      {error ? (
        <Card className="border-rose-500/40 bg-rose-500/10">
          <CardContent className="py-6 text-sm text-rose-600">
            Impossible de charger les conseils pour le moment. Réessaie plus tard.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="flex h-40 items-center justify-center gap-3 text-muted-foreground">
            <Loader2Icon className="size-5 animate-spin" aria-hidden="true" />
            <span>Chargement des conseils...</span>
          </CardContent>
        </Card>
      ) : filteredAndSortedAdvices.length === 0 ? (
        emptyState
      ) : (
        <div className="space-y-4">
          {filteredAndSortedAdvices.map((advice) => (
            <AdviceCard
              key={advice.id}
              advice={advice}
              onVote={handleVote}
              pending={pendingVoteId === advice.id}
              onDelete={handleDelete}
              canDelete={Boolean(advice.canDelete)}
              deletePending={deletePendingId === advice.id}
            />
          ))}
        </div>
      )}
    </section>
  );
};



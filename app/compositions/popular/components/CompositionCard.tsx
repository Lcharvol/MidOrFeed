"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChampionIcon } from "@/components/ChampionIcon";
import { BookmarkIcon, CopyIcon, Loader2Icon } from "lucide-react";
import { ROLE_LABELS } from "@/lib/compositions/roles";
import { useI18n } from "@/lib/i18n-context";
import type { CompositionSuggestionDTO } from "@/types";
import {
  championBadgeClass,
  compositionBackground,
  formatConfidence,
  formatUpdatedAt,
} from "./utils";

type CompositionCardProps = {
  resolveSlug: (championId: string) => string;
  resolveName: (championId: string) => string;
  onCopy: (suggestion: CompositionSuggestionDTO) => void;
  onSave: (suggestion: CompositionSuggestionDTO) => void;
  isSaving: boolean;
  saveLabel: string;
  composition: CompositionSuggestionDTO;
  featured?: boolean;
};

export const CompositionCard = ({
  composition,
  resolveSlug,
  resolveName,
  onCopy,
  onSave,
  isSaving,
  saveLabel,
  featured = false,
}: CompositionCardProps) => {
  const { t, locale } = useI18n();
  const iconSize = featured ? 72 : 56;
  const intlLocale = locale === "fr" ? "fr-FR" : "en-US";

  return (
    <div className={compositionBackground(composition.role)}>
    <div className="mb-4 flex items-start justify-between">
      <div className="flex flex-col gap-2">
        <Badge className={championBadgeClass(composition.role)}>
          {ROLE_LABELS[composition.role]}
        </Badge>
        <Badge variant="secondary" className="w-fit">
          {t("compositionCard.aiRanking").replace("{rank}", String(composition.rank))}
        </Badge>
      </div>
      <Badge variant="outline">
        {t("compositionCard.confidence")} {formatConfidence(composition.confidence)}
      </Badge>
    </div>
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {composition.teamChampions.map((championId) => (
          <div
            key={`${composition.id}-${championId}`}
            className="flex flex-col items-center"
          >
            <ChampionIcon
              championId={resolveSlug(championId)}
              size={iconSize}
              shape="rounded"
              className="border border-primary/30"
            />
            <span className="mt-1 text-xs font-medium text-muted-foreground">
              {resolveName(championId)}
            </span>
          </div>
        ))}
      </div>
      {composition.reasoning && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {composition.reasoning}
        </p>
      )}
      <NarrativeSection composition={composition} />
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          {t("compositionCard.updatedAt").replace("{date}", formatUpdatedAt(composition.updatedAt, intlLocale))}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSave(composition)}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <BookmarkIcon className="size-4" />
            )}
            {saveLabel}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(composition)}
            className="gap-2"
          >
            <CopyIcon className="size-4" />
            {t("compositionCard.copy")}
          </Button>
        </div>
      </div>
    </div>
  </div>
  );
};

function NarrativeSection({ composition }: { composition: CompositionSuggestionDTO }) {
  const { t } = useI18n();

  const blocks = [
    { title: t("compositionCard.strengths"), content: composition.strengths },
    { title: t("compositionCard.weaknesses"), content: composition.weaknesses },
    { title: t("compositionCard.playstyle"), content: composition.playstyle },
  ].filter((b) => b.content);

  if (blocks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/40 bg-background/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
          {t("compositionCard.pendingTitle")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("compositionCard.pendingDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-xl border border-border/40 bg-background/60 p-4">
      {blocks.map((block) => (
        <div key={block.title} className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
            {block.title}
          </p>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {block.content}
          </p>
        </div>
      ))}
    </div>
  );
}

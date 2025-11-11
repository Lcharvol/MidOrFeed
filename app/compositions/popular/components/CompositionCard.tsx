"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChampionIcon } from "@/components/ChampionIcon";
import { CopyIcon } from "lucide-react";
import { ROLE_LABELS } from "@/lib/compositions/roles";
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
  composition: CompositionSuggestionDTO;
};

export const CompositionCard = ({
  composition,
  resolveSlug,
  resolveName,
  onCopy,
}: CompositionCardProps) => {
  const narrativeSection = renderNarrativeSection(composition);

  return (
    <div className={compositionBackground(composition.role)}>
    <div className="mb-4 flex items-start justify-between">
      <div className="flex flex-col gap-2">
        <Badge className={championBadgeClass(composition.role)}>
          {ROLE_LABELS[composition.role]}
        </Badge>
        <Badge variant="secondary" className="w-fit">
          #{composition.rank} au classement IA
        </Badge>
      </div>
      <Badge variant="outline">
        Confiance {formatConfidence(composition.confidence)}
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
              size={56}
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
      {narrativeSection}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          Mis à jour le {formatUpdatedAt(composition.updatedAt)}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(composition)}
            className="gap-2"
          >
            <CopyIcon className="size-4" />
            Copier
          </Button>
        </div>
      </div>
    </div>
  </div>
  );
};

const renderNarrativeSection = (composition: CompositionSuggestionDTO) => {
  const blocks = [
    renderNarrativeBlock("Points forts", composition.strengths),
    renderNarrativeBlock("Points faibles", composition.weaknesses),
    renderNarrativeBlock("Comment la jouer", composition.playstyle),
  ].filter(Boolean);

  if (blocks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/40 bg-background/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
          Descriptif en attente
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajoutez les points forts, les points faibles et les conseils de jeu via l’analyse ou une IA pour enrichir cette composition.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-xl border border-border/40 bg-background/60 p-4">
      {blocks}
    </div>
  );
};

const renderNarrativeBlock = (title: string, content?: string | null) => {
  if (!content) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
        {title}
      </p>
      <p className="whitespace-pre-line text-sm text-muted-foreground">
        {content}
      </p>
    </div>
  );
};


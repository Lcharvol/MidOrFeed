"use client";

import { Button } from "@/components/ui/button";
import { RefreshCwIcon, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

type PopularHeroProps = {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastGeneratedAt?: string;
};

export const PopularHero = ({
  onRefresh,
  isRefreshing,
  lastGeneratedAt,
}: PopularHeroProps) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div className="space-y-2">
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm",
          "bg-primary/10 text-primary"
        )}
      >
        <RefreshCwIcon className="size-4 animate-spin-slow" />
        Suggestions IA
      </div>
      <h1 className="text-4xl font-bold">Compositions populaires</h1>
      <p className="max-w-2xl text-muted-foreground">
        Découvrez les compositions globales les mieux notées par notre IA,
        basées sur les performances agrégées des champions analysés.
      </p>
      {lastGeneratedAt && (
        <p className="text-sm text-muted-foreground/80">
          Dernière génération : {lastGeneratedAt}
        </p>
      )}
    </div>
    <Button
      variant="outline"
      onClick={onRefresh}
      disabled={isRefreshing}
      className="gap-2"
    >
      {isRefreshing ? (
        <>
          <Loader2Icon className="size-4 animate-spin" />
          Mise à jour...
        </>
      ) : (
        <>
          <RefreshCwIcon className="size-4" />
          Rafraîchir
        </>
      )}
    </Button>
  </div>
);

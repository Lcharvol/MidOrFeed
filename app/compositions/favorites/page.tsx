"use client";

import { useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionIcon } from "@/components/ChampionIcon";
import {
  FolderHeartIcon,
  Trash2Icon,
  PlusIcon,
  SparklesIcon,
  Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useApiSWR } from "@/lib/hooks/swr";
import { useChampions } from "@/lib/hooks/use-champions";
import { authenticatedFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Composition = {
  id: string;
  name: string;
  top: string | null;
  jungle: string | null;
  mid: string | null;
  adc: string | null;
  support: string | null;
  createdAt: string;
  updatedAt: string;
};

type CompositionsResponse = {
  success: boolean;
  data: Composition[];
};

const ROLES = [
  { key: "top", label: "TOP" },
  { key: "jungle", label: "JGL" },
  { key: "mid", label: "MID" },
  { key: "adc", label: "ADC" },
  { key: "support", label: "SUP" },
] as const;

type RoleKey = (typeof ROLES)[number]["key"];

const CompositionCard = ({
  composition,
  resolveSlug,
  resolveName,
  onDelete,
  isDeleting,
}: {
  composition: Composition;
  resolveSlug: (value: string) => string;
  resolveName: (value: string) => string;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) => {
  const filledCount = ROLES.filter(
    (role) => composition[role.key as RoleKey] !== null
  ).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{composition.name}</h3>
            <p className="text-xs text-muted-foreground">
              {filledCount}/5 champions - {formatDate(composition.updatedAt)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={() => onDelete(composition.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <Trash2Icon className="size-4 text-destructive" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {ROLES.map((role) => {
            const championId = composition[role.key as RoleKey];
            return (
              <div key={role.key} className="flex flex-col items-center">
                {championId ? (
                  <ChampionIcon
                    championId={resolveSlug(championId)}
                    size={40}
                    className="rounded-md border border-border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">-</span>
                  </div>
                )}
                <span className="text-[9px] text-muted-foreground mt-1">
                  {role.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Champion names */}
        <div className="mt-2 flex flex-wrap gap-1">
          {ROLES.map((role) => {
            const championId = composition[role.key as RoleKey];
            if (!championId) return null;
            return (
              <span
                key={role.key}
                className="text-[10px] px-1.5 py-0.5 bg-muted rounded"
              >
                {resolveName(championId)}
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default function CompositionsFavoritesPage() {
  const { user } = useAuth();
  const { resolveSlug, resolveName, isLoading: championsLoading } = useChampions();

  const { data, isLoading, mutate } = useApiSWR<CompositionsResponse>(
    user ? "/api/compositions" : null,
    { revalidateOnFocus: false }
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await authenticatedFetch(`/api/compositions/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Erreur");
        toast.success("Composition supprimee");
        mutate();
      } catch {
        toast.error("Erreur lors de la suppression");
      }
    },
    [mutate]
  );

  if (!user) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <FolderHeartIcon className="size-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Mes Compositions</h1>
        <p className="text-muted-foreground mb-6">
          Connectez-vous pour voir et gerer vos compositions sauvegardees
        </p>
        <Button asChild>
          <Link href="/login">Se connecter</Link>
        </Button>
      </div>
    );
  }

  const compositions = data?.data || [];
  const loading = isLoading || championsLoading;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderHeartIcon className="size-8 text-primary" />
            Mes Compositions
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerez vos compositions d'equipe sauvegardees
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/compositions/popular">
              <SparklesIcon className="size-4 mr-2" />
              Populaires
            </Link>
          </Button>
          <Button asChild>
            <Link href="/compositions/create">
              <PlusIcon className="size-4 mr-2" />
              Creer
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <Skeleton key={j} className="w-10 h-10 rounded-md" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : compositions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderHeartIcon className="size-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucune composition</h2>
            <p className="text-muted-foreground mb-6">
              Creez votre premiere composition d'equipe pour la sauvegarder ici
            </p>
            <Button asChild>
              <Link href="/compositions/create">
                <PlusIcon className="size-4 mr-2" />
                Creer une composition
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {compositions.map((composition) => (
            <CompositionCard
              key={composition.id}
              composition={composition}
              resolveSlug={resolveSlug}
              resolveName={resolveName}
              onDelete={handleDelete}
              isDeleting={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

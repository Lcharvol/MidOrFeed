"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { HeartIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useApiSWR } from "@/lib/hooks/swr";
import { authenticatedFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  puuid: string;
  region: string;
  gameName?: string | null;
  tagLine?: string | null;
  className?: string;
  variant?: "default" | "icon";
}

type FavoritesResponse = {
  success: boolean;
  data: Array<{ puuid: string }>;
};

export function FavoriteButton({
  puuid,
  region,
  gameName,
  tagLine,
  className,
  variant = "default",
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const { data, mutate } = useApiSWR<FavoritesResponse>(
    user ? "/api/favorites" : null,
    { revalidateOnFocus: false }
  );

  const isFavorite = data?.data?.some((f) => f.puuid === puuid) ?? false;

  const toggleFavorite = useCallback(async () => {
    if (!user) {
      toast.error("Connectez-vous pour ajouter des favoris");
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        const res = await authenticatedFetch(`/api/favorites?puuid=${puuid}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Erreur");
        toast.success("Retiré des favoris");
      } else {
        const res = await authenticatedFetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ puuid, region, gameName, tagLine }),
        });
        if (!res.ok) throw new Error("Erreur");
        toast.success("Ajouté aux favoris");
      }
      mutate();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsLoading(false);
    }
  }, [user, isFavorite, puuid, region, gameName, tagLine, mutate]);

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFavorite}
        disabled={isLoading}
        className={cn("h-8 w-8", className)}
        title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        {isLoading ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <HeartIcon
            className={cn(
              "size-4 transition-colors",
              isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
            )}
          />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={isFavorite ? "secondary" : "outline"}
      size="sm"
      onClick={toggleFavorite}
      disabled={isLoading}
      className={cn("gap-2", className)}
    >
      {isLoading ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <HeartIcon
          className={cn(
            "size-4",
            isFavorite ? "fill-red-500 text-red-500" : ""
          )}
        />
      )}
      {isFavorite ? "Favori" : "Ajouter"}
    </Button>
  );
}

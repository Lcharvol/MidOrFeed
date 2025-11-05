import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const riotAccountSchema = z.object({
  gameName: z.string().min(1, "Le nom de jeu est requis"),
  tagLine: z.string().min(1, "Le tag est requis"),
  region: z.string().min(1, "La région est requise"),
});

export type RiotAccountFormValues = z.infer<typeof riotAccountSchema>;

interface User {
  id: string;
  name?: string | null;
  email?: string;
  riotGameName?: string | null;
  riotTagLine?: string | null;
  riotRegion?: string | null;
  riotPuuid?: string | null;
  riotSummonerId?: string | null;
  leagueAccount?: {
    riotGameName?: string | null;
    riotTagLine?: string | null;
    riotRegion?: string | null;
  } | null;
}

interface UseRiotAccountFormProps {
  user: User | null;
  login: (user: unknown) => void | Promise<void>;
}

export function useRiotAccountForm({ user, login }: UseRiotAccountFormProps) {
  const riotGameName =
    user?.leagueAccount?.riotGameName || user?.riotGameName || "";
  const riotTagLine =
    user?.leagueAccount?.riotTagLine || user?.riotTagLine || "";
  const riotRegion = user?.leagueAccount?.riotRegion || user?.riotRegion || "";

  const form = useForm<RiotAccountFormValues>({
    resolver: zodResolver(riotAccountSchema),
    defaultValues: {
      gameName: riotGameName,
      tagLine: riotTagLine,
      region: riotRegion,
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveAccount = async (values: RiotAccountFormValues) => {
    const { gameName, tagLine, region } = values;

    setIsSaving(true);
    try {
      // Rechercher le compte via l'API Account
      const searchResponse = await fetch("/api/riot/search-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameName,
          tagLine,
          region,
        }),
      });

      const searchResult = await searchResponse.json();

      if (!searchResponse.ok) {
        toast.error(searchResult.error || "Compte non trouvé");
        return;
      }

      const { puuid } = searchResult.data;

      // Sauvegarder le compte dans la base de données
      const response = await fetch("/api/user/save-riot-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({
          gameName,
          tagLine,
          puuid,
          region,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Erreur lors de la sauvegarde");
        return;
      }

      // Mettre à jour l'utilisateur dans le contexte
      if (user && result.user) {
        login(result.user as unknown);
      }

      toast.success("Compte Riot sauvegardé avec succès!");
      setIsEditing(false);
      form.reset();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAccount = () => {
    if (user) {
      form.reset({
        gameName: riotGameName,
        tagLine: riotTagLine,
        region: riotRegion,
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    form.reset({
      gameName: riotGameName,
      tagLine: riotTagLine,
      region: riotRegion,
    });
  };

  const handleAnalyzeMatches = async () => {
    if (!user?.riotPuuid || !user?.riotRegion) {
      toast.error("Vous devez d'abord sauvegarder votre compte Riot");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/matches/collect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          puuid: user.riotPuuid,
          region: user.riotRegion,
          count: 20,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Erreur lors de l'analyse");
        return;
      }

      toast.success("Analyse des matchs terminée!");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    form,
    isSaving,
    isAnalyzing,
    isEditing,
    setIsEditing,
    handleSaveAccount,
    handleEditAccount,
    handleCancelEdit,
    handleAnalyzeMatches,
  };
}

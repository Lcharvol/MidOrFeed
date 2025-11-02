import { useState } from "react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
  riotGameName?: string | null;
  riotTagLine?: string | null;
  riotRegion?: string | null;
  riotPuuid?: string | null;
  riotSummonerId?: string | null;
}

interface UseRiotAccountFormProps {
  user: User | null;
  login: (user: User) => void;
}

export function useRiotAccountForm({ user, login }: UseRiotAccountFormProps) {
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [region, setRegion] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveAccount = async () => {
    if (!gameName || !tagLine || !region) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

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
        login(result.user);
      }

      toast.success("Compte Riot sauvegardé avec succès!");
      setIsEditing(false);
      setGameName("");
      setTagLine("");
      setRegion("");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAccount = () => {
    if (user && user.riotGameName) {
      setGameName(user.riotGameName);
      setTagLine(user.riotTagLine || "");
      setRegion(user.riotRegion || "");
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setGameName("");
    setTagLine("");
    setRegion("");
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
    gameName,
    setGameName,
    tagLine,
    setTagLine,
    region,
    setRegion,
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

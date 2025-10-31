"use client";

import { useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

// Interface pour les champions
interface Champion {
  id: string;
  championId: string;
  name: string;
  title: string;
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
  hp: number;
}

interface ChampionsResponse {
  success: boolean;
  data: Champion[];
  count: number;
}

const fetcher = async (url: string): Promise<ChampionsResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Erreur lors de la récupération des champions");
  }
  return res.json();
};

const ROLES = [
  { value: "top", label: "Top Lane", icon: "⚔️" },
  { value: "jungle", label: "Jungle", icon: "🌲" },
  { value: "mid", label: "Mid Lane", icon: "🔮" },
  { value: "adc", label: "ADC / Bot Carry", icon: "🏹" },
  { value: "support", label: "Support", icon: "🛡️" },
];

const getChampionImageUrl = (championId: string): string => {
  const version = "15.21.1";
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championId}.png`;
};

export default function CreateCompositionPage() {
  const [compositionName, setCompositionName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChampions, setSelectedChampions] = useState<
    Record<string, Champion | null>
  >({
    top: null,
    jungle: null,
    mid: null,
    adc: null,
    support: null,
  });

  const { data, error, isLoading } = useSWR<ChampionsResponse>(
    "/api/champions/list",
    fetcher
  );

  const champions = data?.data || [];

  // Filtrer les champions par recherche
  const filteredChampions = champions.filter((champion) =>
    champion.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChampionSelect = (role: string, champion: Champion) => {
    setSelectedChampions((prev) => ({
      ...prev,
      [role]: champion,
    }));
    toast.success(
      `${champion.name} ajouté en ${ROLES.find((r) => r.value === role)?.label}`
    );
  };

  const handleChampionRemove = (role: string) => {
    setSelectedChampions((prev) => ({
      ...prev,
      [role]: null,
    }));
  };

  const handleSave = () => {
    const selectedCount = Object.values(selectedChampions).filter(
      (champ) => champ !== null
    ).length;

    if (selectedCount === 0) {
      toast.error("Veuillez sélectionner au moins un champion");
      return;
    }

    if (!compositionName.trim()) {
      toast.error("Veuillez donner un nom à votre composition");
      return;
    }

    // TODO: Sauvegarder la composition
    toast.success("Composition sauvegardée avec succès!");
    console.log("Composition:", { compositionName, selectedChampions });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Créer une composition</h1>
        <p className="text-muted-foreground">
          Construisez votre équipe idéale pour League of Legends
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Colonne gauche - Sélection des champions */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Nom de la composition */}
            <Card>
              <CardHeader>
                <CardTitle>Nom de la composition</CardTitle>
                <CardDescription>
                  Donnez un nom à votre composition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Ex: Composition Meta du patch 15.21"
                  value={compositionName}
                  onChange={(e) => setCompositionName(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Rôles et champions sélectionnés */}
            <Card>
              <CardHeader>
                <CardTitle>Équipe</CardTitle>
                <CardDescription>
                  Sélectionnez les champions pour chaque position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ROLES.map((role) => (
                    <div key={role.value} className="space-y-2">
                      <Label className="flex items-center gap-2 text-base">
                        <span>{role.icon}</span>
                        {role.label}
                      </Label>
                      {selectedChampions[role.value] ? (
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <Image
                              src={getChampionImageUrl(
                                selectedChampions[role.value]!.championId
                              )}
                              alt={selectedChampions[role.value]!.name}
                              width={48}
                              height={48}
                              className="rounded"
                            />
                            <div>
                              <div className="font-medium">
                                {selectedChampions[role.value]!.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {selectedChampions[role.value]!.title}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleChampionRemove(role.value)}
                          >
                            <XIcon className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex h-16 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                          Aucun champion sélectionné
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Liste des champions disponibles */}
            <Card>
              <CardHeader>
                <CardTitle>Champions disponibles</CardTitle>
                <CardDescription>
                  Recherchez et sélectionnez un champion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    placeholder="Rechercher un champion..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />

                  {isLoading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2Icon className="size-8 animate-spin text-primary" />
                    </div>
                  )}

                  {error && (
                    <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
                      <p className="text-destructive">
                        Erreur lors du chargement des champions
                      </p>
                    </div>
                  )}

                  {!isLoading && !error && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {filteredChampions.map((champion) => {
                        const isSelected = Object.values(
                          selectedChampions
                        ).some((champ) => champ?.id === champion.id);

                        return (
                          <div
                            key={champion.id}
                            className={`group relative cursor-pointer rounded-lg border transition-all hover:border-primary/50 ${
                              isSelected
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:shadow-md"
                            }`}
                          >
                            <Image
                              src={getChampionImageUrl(champion.championId)}
                              alt={champion.name}
                              width={64}
                              height={64}
                              className="w-full rounded-t-lg"
                            />
                            <div className="p-2">
                              <div className="text-center text-sm font-medium">
                                {champion.name}
                              </div>
                            </div>

                            {!isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                                <div className="grid grid-cols-5 gap-1 rounded-lg bg-background/95 p-2 shadow-lg">
                                  {ROLES.map((role) => (
                                    <button
                                      key={role.value}
                                      onClick={() =>
                                        handleChampionSelect(
                                          role.value,
                                          champion
                                        )
                                      }
                                      className="flex size-10 items-center justify-center rounded border transition-colors hover:bg-primary hover:text-primary-foreground"
                                      title={`Ajouter en ${role.label}`}
                                    >
                                      <span className="text-xs">
                                        {role.icon}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Colonne droite - Aperçu et actions */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Aperçu</CardTitle>
              <CardDescription>Votre composition actuelle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Résumé des champions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Champions</span>
                    <Badge variant="secondary">
                      {
                        Object.values(selectedChampions).filter(
                          (champ) => champ !== null
                        ).length
                      }
                      /5
                    </Badge>
                  </div>

                  {Object.entries(selectedChampions).map(([role, champion]) => {
                    if (!champion) return null;
                    const roleInfo = ROLES.find((r) => r.value === role);
                    return (
                      <div
                        key={role}
                        className="flex items-center gap-2 rounded-lg border p-2"
                      >
                        <span className="text-xs">{roleInfo?.icon}</span>
                        <span className="flex-1 text-sm">{champion.name}</span>
                      </div>
                    );
                  })}

                  {Object.values(selectedChampions).every(
                    (champ) => champ === null
                  ) && (
                    <p className="text-center text-sm text-muted-foreground">
                      Aucun champion sélectionné
                    </p>
                  )}
                </div>

                {/* Boutons d'action */}
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    <PlusIcon className="mr-2 size-5" />
                    Sauvegarder la composition
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedChampions({
                        top: null,
                        jungle: null,
                        mid: null,
                        adc: null,
                        support: null,
                      });
                      setCompositionName("");
                      toast.success("Composition réinitialisée");
                    }}
                  >
                    Réinitialiser
                  </Button>
                </div>

                {/* Stats moyennes */}
                {Object.values(selectedChampions).some(
                  (champ) => champ !== null
                ) && (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="mb-3 text-sm font-medium">
                      Statistiques moyennes
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Attaque</span>
                        <span className="font-medium">
                          {Math.round(
                            Object.values(selectedChampions)
                              .filter((champ) => champ !== null)
                              .reduce((sum, champ) => sum + champ!.attack, 0) /
                              Object.values(selectedChampions).filter(
                                (champ) => champ !== null
                              ).length
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Défense</span>
                        <span className="font-medium">
                          {Math.round(
                            Object.values(selectedChampions)
                              .filter((champ) => champ !== null)
                              .reduce((sum, champ) => sum + champ!.defense, 0) /
                              Object.values(selectedChampions).filter(
                                (champ) => champ !== null
                              ).length
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Magie</span>
                        <span className="font-medium">
                          {Math.round(
                            Object.values(selectedChampions)
                              .filter((champ) => champ !== null)
                              .reduce((sum, champ) => sum + champ!.magic, 0) /
                              Object.values(selectedChampions).filter(
                                (champ) => champ !== null
                              ).length
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldIcon, PlusIcon, XIcon } from "lucide-react";

const STRENGTH_SUGGESTIONS = [
  "Bon waveclear",
  "Fort en 1v1",
  "Excellent engage",
  "Très mobile",
  "Bon sustain",
  "Fort en late game",
  "Burst élevé",
  "Bon poke",
  "Bon split push",
  "Forte pression de map",
  "Bon pour les objectifs",
  "Contrôle de zone",
  "CC puissant",
  "Bon scaling",
  "Fort en teamfight",
];

const WEAKNESS_SUGGESTIONS = [
  "Vulnérable aux ganks",
  "Faible early game",
  "Peu mobile",
  "Dépendant des items",
  "Faible contre les tanks",
  "Vulnérable au CC",
  "Difficile à maîtriser",
  "Faible waveclear",
  "Mauvais objectifs",
  "Peu de sustain",
  "Vulnérable au poke",
  "Team dépendant",
  "Facilement kité",
  "Mana dépendant",
  "Faible contre les assassins",
];

export const GuideStrengthsWeaknesses = ({
  strengths,
  setStrengths,
  weaknesses,
  setWeaknesses,
}: {
  strengths: string[];
  setStrengths: (v: string[]) => void;
  weaknesses: string[];
  setWeaknesses: (v: string[]) => void;
}) => {
  const handleAddStrength = () => {
    if (strengths.length < 5) {
      setStrengths([...strengths, ""]);
    }
  };

  const handleRemoveStrength = (index: number) => {
    setStrengths(strengths.filter((_, i) => i !== index));
  };

  const handleStrengthChange = (index: number, value: string) => {
    const newStrengths = [...strengths];
    newStrengths[index] = value;
    setStrengths(newStrengths);
  };

  const handleAddWeakness = () => {
    if (weaknesses.length < 5) {
      setWeaknesses([...weaknesses, ""]);
    }
  };

  const handleRemoveWeakness = (index: number) => {
    setWeaknesses(weaknesses.filter((_, i) => i !== index));
  };

  const handleWeaknessChange = (index: number, value: string) => {
    const newWeaknesses = [...weaknesses];
    newWeaknesses[index] = value;
    setWeaknesses(newWeaknesses);
  };

  const handleAddStrengthSuggestion = (suggestion: string) => {
    if (strengths.length >= 5 || strengths.includes(suggestion)) return;
    if (strengths.length === 1 && strengths[0] === "") {
      setStrengths([suggestion]);
    } else {
      setStrengths([...strengths, suggestion]);
    }
  };

  const handleAddWeaknessSuggestion = (suggestion: string) => {
    if (weaknesses.length >= 5 || weaknesses.includes(suggestion)) return;
    if (weaknesses.length === 1 && weaknesses[0] === "") {
      setWeaknesses([suggestion]);
    } else {
      setWeaknesses([...weaknesses, suggestion]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldIcon className="size-5" />
          Points forts et faibles
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Strengths */}
          <div className="space-y-3">
            <Label className="text-win">Points forts</Label>
            {strengths.map((strength, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={strength}
                  onChange={(e) => handleStrengthChange(index, e.target.value)}
                  placeholder="Ex: Bon waveclear"
                  maxLength={200}
                />
                {strengths.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStrength(index)}
                  >
                    <XIcon className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            {strengths.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddStrength}
              >
                <PlusIcon className="size-4 mr-1" />
                Ajouter
              </Button>
            )}
            {/* Suggestions */}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">Suggestions :</p>
              <div className="flex flex-wrap gap-1">
                {STRENGTH_SUGGESTIONS.filter(s => !strengths.includes(s)).slice(0, 8).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleAddStrengthSuggestion(suggestion)}
                    disabled={strengths.length >= 5}
                    className="text-xs px-2 py-1 rounded-full bg-win/10 text-win hover:bg-win/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Weaknesses */}
          <div className="space-y-3">
            <Label className="text-loss">Points faibles</Label>
            {weaknesses.map((weakness, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={weakness}
                  onChange={(e) => handleWeaknessChange(index, e.target.value)}
                  placeholder="Ex: Vulnérable aux ganks"
                  maxLength={200}
                />
                {weaknesses.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveWeakness(index)}
                  >
                    <XIcon className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            {weaknesses.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddWeakness}
              >
                <PlusIcon className="size-4 mr-1" />
                Ajouter
              </Button>
            )}
            {/* Suggestions */}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">Suggestions :</p>
              <div className="flex flex-wrap gap-1">
                {WEAKNESS_SUGGESTIONS.filter(s => !weaknesses.includes(s)).slice(0, 8).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleAddWeaknessSuggestion(suggestion)}
                    disabled={weaknesses.length >= 5}
                    className="text-xs px-2 py-1 rounded-full bg-loss/10 text-loss hover:bg-loss/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

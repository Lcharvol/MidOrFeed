import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Gamepad2Icon,
  Loader2Icon,
  TrendingUpIcon,
  EditIcon,
  XIcon,
} from "lucide-react";
import { RIOT_REGIONS } from "@/lib/riot-regions";

interface RiotAccountSectionProps {
  user: {
    riotGameName?: string | null;
    riotTagLine?: string | null;
    riotRegion?: string | null;
    riotPuuid?: string | null;
    id: string;
  } | null;
  summonerName: string;
  setSummonerName: (value: string) => void;
  region: string;
  setRegion: (value: string) => void;
  isSaving: boolean;
  isAnalyzing: boolean;
  isEditing: boolean;
  onSave: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onAnalyzeMatches: () => void;
}

export function RiotAccountSection({
  user,
  summonerName,
  setSummonerName,
  region,
  setRegion,
  isSaving,
  isAnalyzing,
  isEditing,
  onSave,
  onEdit,
  onCancelEdit,
  onAnalyzeMatches,
}: RiotAccountSectionProps) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Compte League of Legends</CardTitle>
        <CardDescription>Connectez votre compte Riot Games</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user?.riotGameName && !isEditing ? (
          <>
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Gamepad2Icon className="size-5 text-primary" />
                  <span className="font-semibold">{user.riotGameName}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <EditIcon className="size-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Région : {user.riotRegion?.toUpperCase()}
              </p>
            </div>
            <Button
              onClick={onAnalyzeMatches}
              disabled={isAnalyzing}
              className="w-full"
              variant="outline"
            >
              {isAnalyzing ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <TrendingUpIcon className="mr-2 size-4" />
                  Analyser mes matchs
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            {isEditing && (
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Modifier votre compte Riot
                </h3>
                <Button variant="ghost" size="icon" onClick={onCancelEdit}>
                  <XIcon className="size-4" />
                </Button>
              </div>
            )}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="summonerName">Nom d'invocateur</Label>
                  <Input
                    id="summonerName"
                    placeholder="Entrez votre nom d'invocateur..."
                    value={summonerName}
                    onChange={(e) => setSummonerName(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Votre nom in-game League of Legends
                  </p>
                </div>
                <div>
                  <Label htmlFor="region">Région</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger id="region">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {RIOT_REGIONS.map((regionOption) => (
                        <SelectItem
                          key={regionOption.value}
                          value={regionOption.value}
                        >
                          {regionOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={onSave} disabled={isSaving} className="flex-1">
                {isSaving ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : isEditing ? (
                  "Mettre à jour le compte"
                ) : (
                  "Sauvegarder le compte"
                )}
              </Button>
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={onCancelEdit}
                  disabled={isSaving}
                >
                  Annuler
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

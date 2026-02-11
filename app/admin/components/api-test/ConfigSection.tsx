"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAuth } from "@/lib/auth-context";
import { REGIONS } from "./types";

interface ConfigSectionProps {
  region: string;
  setRegion: (region: string) => void;
  puuid: string;
  setPuuid: (puuid: string) => void;
}

export const ConfigSection = ({ region, setRegion, puuid, setPuuid }: ConfigSectionProps) => {
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
        <CardDescription>
          Parametres pour tester les APIs Riot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger id="region">
                <SelectValue placeholder="Selectionnez une region" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="puuid">PUUID</Label>
            <Input
              id="puuid"
              value={puuid}
              onChange={(e) => setPuuid(e.target.value)}
              placeholder="Entrez un PUUID"
            />
            {user?.riotPuuid && puuid !== user.riotPuuid && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => setPuuid(user.riotPuuid || "")}
              >
                Utiliser mon PUUID
              </Button>
            )}
          </div>
        </div>
        {user?.riotPuuid && (
          <div className="text-sm text-muted-foreground">
            Votre compte: <span className="font-medium">{user.riotGameName}#{user.riotTagLine}</span>
            {" "}({user.riotRegion?.toUpperCase()})
          </div>
        )}
      </CardContent>
    </Card>
  );
};

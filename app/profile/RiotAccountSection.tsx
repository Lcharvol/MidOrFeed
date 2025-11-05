"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import type { UseFormReturn } from "react-hook-form";
import type { RiotAccountFormValues } from "@/lib/hooks/use-riot-account-form";

interface RiotAccountSectionProps {
  user: {
    riotGameName?: string | null;
    riotTagLine?: string | null;
    riotRegion?: string | null;
    riotPuuid?: string | null;
    leagueAccount?: {
      riotGameName?: string | null;
      riotTagLine?: string | null;
      riotRegion?: string | null;
    } | null;
    id: string;
  } | null;
  form: UseFormReturn<RiotAccountFormValues>;
  isSaving: boolean;
  isAnalyzing: boolean;
  isEditing: boolean;
  onSave: (values: RiotAccountFormValues) => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onAnalyzeMatches: () => void;
}

export function RiotAccountSection({
  user,
  form,
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
        {(user?.leagueAccount?.riotGameName || user?.riotGameName) &&
        !isEditing ? (
          <>
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Gamepad2Icon className="size-5 text-primary" />
                  <span className="font-semibold">
                    {user.leagueAccount?.riotGameName || user.riotGameName}
                    {(user.leagueAccount?.riotTagLine || user.riotTagLine) &&
                      `#${user.leagueAccount?.riotTagLine || user.riotTagLine}`}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <EditIcon className="size-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Région :{" "}
                {(
                  user.leagueAccount?.riotRegion || user.riotRegion
                )?.toUpperCase()}
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
              {isEditing && (
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Modifier votre compte Riot
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onCancelEdit}
                  >
                    <XIcon className="size-4" />
                  </Button>
                </div>
              )}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gameName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de jeu</FormLabel>
                        <FormControl>
                          <Input placeholder="Votre nom de jeu..." {...field} />
                        </FormControl>
                        <FormDescription>Votre nom in-game</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tagLine"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tag</FormLabel>
                        <FormControl>
                          <Input placeholder="Votre tag..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Format: EUW1, NA1, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Région</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormDescription>
                        Sélectionnez votre région de jeu
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving} className="flex-1">
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
                    type="button"
                    variant="outline"
                    onClick={onCancelEdit}
                    disabled={isSaving}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

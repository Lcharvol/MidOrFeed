"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  SearchIcon,
  UserIcon,
  Loader2Icon,
  TrophyIcon,
  ChevronRightIcon,
  SparklesIcon,
  BarChart3Icon,
  SwordsIcon,
  TargetIcon,
} from "lucide-react";
import { toast } from "sonner";
import { RIOT_REGIONS } from "@/lib/riot-regions";
import { PlayerSearchInput } from "@/components/PlayerSearchInput";
import { getProfileIconUrl } from "@/constants/ddragon";
import { useI18n } from "@/lib/i18n-context";
import Link from "next/link";

export default function SummonersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("euw1");
  const [isSearching, setIsSearching] = useState(false);

  const hasLinkedAccount = user?.leagueAccount?.puuid && user?.leagueAccount?.riotRegion;

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      toast.error("Entrez un nom de joueur");
      return;
    }

    // Parse gameName#tagLine format
    const trimmed = query.trim();
    const hashIndex = trimmed.lastIndexOf("#");

    if (hashIndex === -1 || hashIndex === 0 || hashIndex === trimmed.length - 1) {
      toast.error("Format invalide. Utilisez Nom#TAG");
      return;
    }

    const gameName = trimmed.slice(0, hashIndex).trim();
    const tagLine = trimmed.slice(hashIndex + 1).trim();

    setIsSearching(true);
    try {
      const response = await fetch("/api/riot/search-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameName, tagLine, region }),
      });

      const data = await response.json();

      if (!response.ok || !data.data?.puuid) {
        toast.error(data.error || "Joueur non trouve");
        return;
      }

      router.push(`/summoners/${data.data.puuid}/overview?region=${region}`);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la recherche");
    } finally {
      setIsSearching(false);
    }
  }, [query, region, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px] opacity-50" />

        <div className="container relative mx-auto px-4 py-16 sm:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-4">
              <SparklesIcon className="size-4" />
              <span>Analysez n&apos;importe quel joueur</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Rechercher un{" "}
              <span className="text-primary">Invocateur</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Consultez les statistiques detaillees, l&apos;historique des matchs et les performances de n&apos;importe quel joueur.
            </p>

            {/* Search Box */}
            <Card className="mt-8 border-border/60 shadow-xl bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-3" onKeyDown={handleKeyDown}>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger className="w-full sm:w-28">
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent>
                      {RIOT_REGIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex-1">
                    <PlayerSearchInput
                      value={query}
                      onChange={setQuery}
                      region={region}
                      placeholder="Nom#TAG (ex: Faker#KR1)"
                      onSelect={(result) => {
                        router.push(`/summoners/${result.puuid}/overview?region=${result.region}`);
                      }}
                    />
                  </div>

                  <Button
                    onClick={handleSearch}
                    disabled={isSearching}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    {isSearching ? (
                      <Loader2Icon className="size-5 animate-spin" />
                    ) : (
                      <>
                        <SearchIcon className="size-5 mr-2" />
                        Rechercher
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Linked Account Card */}
          {hasLinkedAccount && (
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-14 border-2 border-primary/30">
                      {user?.leagueAccount?.profileIconId ? (
                        <AvatarImage
                          src={getProfileIconUrl(user.leagueAccount.profileIconId)}
                          alt={user.leagueAccount.riotGameName || ""}
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {user?.leagueAccount?.riotGameName?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">
                          {user?.leagueAccount?.riotGameName}
                        </span>
                        <span className="text-muted-foreground">
                          #{user?.leagueAccount?.riotTagLine}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {user?.leagueAccount?.riotRegion?.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Votre compte lie
                      </p>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href={`/summoners/${user?.leagueAccount?.puuid}/overview?region=${user?.leagueAccount?.riotRegion}`}>
                      Voir mon profil
                      <ChevronRightIcon className="size-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feature Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="group hover:border-primary/30 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <BarChart3Icon className="size-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Statistiques detaillees</h3>
                <p className="text-sm text-muted-foreground">
                  KDA, winrate, CS/min, vision score et bien plus encore.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:border-primary/30 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <SwordsIcon className="size-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Historique des matchs</h3>
                <p className="text-sm text-muted-foreground">
                  Analysez chaque partie avec des details complets sur les performances.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:border-primary/30 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <TrophyIcon className="size-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Classement</h3>
                <p className="text-sm text-muted-foreground">
                  Suivez la progression en ranked Solo/Duo et Flex.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:border-primary/30 transition-colors">
              <CardContent className="p-6 space-y-3">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <TargetIcon className="size-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Champions maitrise</h3>
                <p className="text-sm text-muted-foreground">
                  Decouvrez les champions les plus joues et leur performance.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:border-primary/30 transition-colors sm:col-span-2 lg:col-span-2">
              <CardContent className="p-6 flex items-center gap-6">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                  <UserIcon className="size-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Comparer des joueurs</h3>
                  <p className="text-sm text-muted-foreground">
                    Comparez les statistiques de deux joueurs cote a cote pour une analyse approfondie.
                  </p>
                </div>
                <Button variant="outline" asChild className="shrink-0">
                  <Link href="/compare">
                    Comparer
                    <ChevronRightIcon className="size-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-3 justify-center pt-4">
            <Button variant="outline" asChild>
              <Link href="/leaderboard">
                <TrophyIcon className="size-4 mr-2" />
                Classement
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/tier-list/champions">
                <BarChart3Icon className="size-4 mr-2" />
                Tier List
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/champions">
                <SwordsIcon className="size-4 mr-2" />
                Champions
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

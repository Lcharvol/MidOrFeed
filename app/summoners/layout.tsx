"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2Icon } from "lucide-react";
import { useRiotProfileIcon } from "@/lib/hooks/use-riot-profile-icon";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SummonersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();

  // Rediriger vers la page de profil si pas de compte Riot lié
  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-20">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Non connecté</h3>
              <p className="text-muted-foreground">
                Veuillez vous connecter pour voir votre profil
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user.riotPuuid || !user.riotGameName) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-20">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">
                Compte Riot non lié
              </h3>
              <p className="text-muted-foreground mb-4">
                Veuillez lier votre compte Riot Games dans votre profil
              </p>
              <Button asChild>
                <a href="/profile">Aller au profil</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Charger les détails du profil Riot
  const { profileIconUrl, isLoading: isLoadingIcon } = useRiotProfileIcon(
    user.riotPuuid,
    user.riotRegion
  );

  const isActive = (path: string) => {
    return pathname === `/summoners${path}`;
  };

  return (
    <div className="container mx-auto py-10">
      {/* En-tête du profil */}
      <div className="mb-8">
        <div className="flex items-center gap-6">
          {isLoadingIcon ? (
            <div className="size-24 rounded-full bg-muted animate-pulse" />
          ) : profileIconUrl ? (
            <Avatar className="size-24 border-4 border-primary/20">
              <AvatarImage src={profileIconUrl} alt="Profile" />
              <AvatarFallback>Loading</AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="size-24 border-4 border-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-4xl">
                {user.riotGameName?.[0].toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">
              {user.riotGameName}
              {user.riotTagLine && (
                <span className="text-muted-foreground">
                  #{user.riotTagLine}
                </span>
              )}
            </h1>
            {user.riotRegion && (
              <Badge variant="outline" className="text-lg px-3 py-1">
                {user.riotRegion.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b mb-6">
        <div className="flex gap-8">
          <Link
            href="/summoners/overview"
            className={`pb-4 px-2 font-semibold transition-colors relative ${
              isActive("/overview")
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Vue d&apos;ensemble
          </Link>
          <Link
            href="/summoners/champions"
            className={`pb-4 px-2 font-semibold transition-colors relative ${
              isActive("/champions")
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Champions
          </Link>
          <Link
            href="/summoners/matches"
            className={`pb-4 px-2 font-semibold transition-colors relative ${
              isActive("/matches")
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Matchs
          </Link>
        </div>
      </div>

      {/* Contenu des pages */}
      {children}
    </div>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronRightIcon } from "lucide-react";
import { getProfileIconUrl } from "@/constants/ddragon";
import Link from "next/link";

interface LinkedAccountCardProps {
  leagueAccount: {
    id: string;
    puuid: string;
    riotRegion: string;
    riotGameName?: string | null;
    riotTagLine?: string | null;
    profileIconId?: number | null;
  };
}

export function LinkedAccountCard({ leagueAccount }: LinkedAccountCardProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14 border-0">
              {leagueAccount.profileIconId ? (
                <AvatarImage
                  src={getProfileIconUrl(leagueAccount.profileIconId)}
                  alt={leagueAccount.riotGameName || ""}
                />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {leagueAccount.riotGameName?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">
                  {leagueAccount.riotGameName}
                </span>
                <span className="text-muted-foreground">
                  #{leagueAccount.riotTagLine}
                </span>
                <Badge emphasis="info" emphasisVariant="subtle" className="text-xs">
                  {leagueAccount.riotRegion?.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Votre compte lie
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href={`/summoners/${leagueAccount.puuid}/overview?region=${leagueAccount.riotRegion}`}>
              Voir mon profil
              <ChevronRightIcon className="size-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { ShardedLeagueAccounts } from "@/lib/prisma-sharded-accounts";

const schema = z.object({ puuid: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { puuid } = schema.parse(body);

    // Chercher dans toutes les régions si la région n'est pas fournie
    const account = await ShardedLeagueAccounts.findUniqueByPuuidGlobal(puuid);

    if (!account) {
      return NextResponse.json(
        { error: "Compte introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: account.id,
          puuid: account.puuid,
          riotRegion: account.riotRegion,
          riotGameName: account.riotGameName,
          riotTagLine: account.riotTagLine,
          profileIconId: account.profileIconId,
          summonerLevel: account.summonerLevel,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[LEAGUE-ACCOUNTS/GET-BY-PUUID]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

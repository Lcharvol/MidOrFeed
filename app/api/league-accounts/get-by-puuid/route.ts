import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ puuid: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { puuid } = schema.parse(body);

    const account = await prisma.leagueOfLegendsAccount.findUnique({
      where: { puuid },
      select: {
        id: true,
        puuid: true,
        riotRegion: true,
        riotGameName: true,
        riotTagLine: true,
        profileIconId: true,
        summonerLevel: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Compte introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: account }, { status: 200 });
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

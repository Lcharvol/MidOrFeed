import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const region = (searchParams.get("region") || "euw1").toLowerCase();
    const tierParam = searchParams.get("tier") || "CHALLENGER";
    const tierUpper = tierParam.toUpperCase();
    const tierLower = tierParam.toLowerCase();
    const take = Math.min(parseInt(searchParams.get("take") || "200", 10), 500);

    const entries = await prisma.leaderboardEntry.findMany({
      where: {
        region,
        queueType: "RANKED_SOLO_5x5",
        tier: { in: [tierUpper, tierLower] },
      },
      orderBy: { leaguePoints: "desc" },
      take,
    });

    return NextResponse.json({ success: true, data: entries }, { status: 200 });
  } catch (e) {
    console.error("[LEADERBOARD/LIST]", e);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}

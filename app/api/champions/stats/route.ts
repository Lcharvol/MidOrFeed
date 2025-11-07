import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const stats = await prisma.championStats.findMany({
      orderBy: [{ score: "desc" }, { totalGames: "desc" }],
    });

    return NextResponse.json(
      {
        success: true,
        data: stats,
        count: stats.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des statistiques",
      },
      { status: 500 }
    );
  }
}

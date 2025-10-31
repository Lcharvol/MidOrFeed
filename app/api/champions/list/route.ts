import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Route GET pour obtenir la liste des champions
export async function GET() {
  try {
    const champions = await prisma.champion.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      {
        success: true,
        data: champions,
        count: champions.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des champions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des champions",
      },
      { status: 500 }
    );
  }
}

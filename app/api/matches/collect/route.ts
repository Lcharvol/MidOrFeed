import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Route API pour collecter et stocker les matchs d'un utilisateur
 * POST /api/matches/collect
 * Body: { puuid: string, region: string, count?: number }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { puuid, region, count = 20 } = body;

    if (!puuid || !region) {
      return NextResponse.json(
        { error: "PUUID et région sont requis" },
        { status: 400 }
      );
    }

    // TODO: Appeler l'API Riot pour récupérer les matchs
    // Pour l'instant, on retourne un message
    return NextResponse.json(
      {
        message: "Fonctionnalité à implémenter avec clé API Riot",
        info: "Cette route collectera les matchs via l'API Match-v5 de Riot",
        puuid,
        region,
        count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la collecte des matchs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la collecte des matchs" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const suggestCompositionSchema = z.object({
  teamChampions: z.array(z.string()).min(1, "Au moins un champion requis"),
  enemyChampions: z.array(z.string()).optional(),
  role: z.enum(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]),
  gameMode: z.string().optional(),
});

/**
 * Route API pour obtenir des suggestions de composition
 * POST /api/matches/suggest-composition
 * Body: { teamChampions: string[], enemyChampions?: string[], role: string, gameMode?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Valider les données
    const validatedData = suggestCompositionSchema.parse(body);

    // Analyser les matchs existants pour trouver des patterns
    const suggestions = await generateSuggestions(validatedData);

    return NextResponse.json(
      {
        success: true,
        suggestions,
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

    console.error("Erreur lors de la génération de suggestions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de suggestions" },
      { status: 500 }
    );
  }
}

/**
 * Génère des suggestions de composition basées sur l'analyse des matchs
 */
async function generateSuggestions(data: {
  teamChampions: string[];
  enemyChampions?: string[];
  role: string;
  gameMode?: string;
}) {
  const { teamChampions, enemyChampions, role } = data;

  // Pour l'instant, on génère des suggestions basiques
  // TODO: Implémenter une vraie IA avec ML en analysant les matchs

  // Étape 1: Récupérer les champions compatibles avec l'équipe actuelle
  const compatibleChampions = await findCompatibleChampions(
    teamChampions,
    role
  );

  // Étape 2: Si des ennemis sont spécifiés, ajouter une couche de contrepick
  const suggestions = await rankChampions(
    compatibleChampions,
    enemyChampions,
    role
  );

  return suggestions;
}

/**
 * Trouve les champions compatibles avec l'équipe actuelle
 */
async function findCompatibleChampions(teamChampions: string[], role: string) {
  // Pour l'instant, on retourne tous les champions
  // TODO: Implémenter une logique de synergie basée sur les matchs gagnants

  const allChampions = await prisma.champion.findMany();

  // Filtrer les champions déjà dans l'équipe
  const availableChampions = allChampions.filter(
    (champion) => !teamChampions.includes(champion.championId)
  );

  return availableChampions;
}

/**
 * Classe les champions par pertinence
 */
async function rankChampions(
  champions: Array<{ championId: string; name: string }>,
  enemyChampions?: string[],
  role?: string
) {
  // Pour l'instant, on retourne simplement les champions
  // TODO: Implémenter le scoring basé sur les matchs

  return champions.slice(0, 10).map((champion, index) => ({
    championId: champion.championId,
    championName: champion.name,
    confidence: 1 - index * 0.05, // Score décroissant
    reasoning: `Champion ${champion.name} suggéré pour le rôle ${role}`,
  }));
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger("champion-runes");

// Mapping des IDs de sorts d'invocateur vers leurs noms
const SUMMONER_SPELL_NAMES: Record<number, string> = {
  1: "Boost",
  3: "Exhaust",
  4: "Flash",
  6: "Ghost",
  7: "Heal",
  11: "Smite",
  12: "Teleport",
  13: "Clarity",
  14: "Ignite",
  21: "Barrier",
  30: "Poro Recall",
  31: "Poro Throw",
  32: "Mark",
  39: "Mark",
  54: "Cleanse",
  55: "Prowler's Claw",
  2201: "Flash",
  2202: "Teleport",
};

const getSummonerSpellName = (spellId: number | null | undefined): string => {
  if (!spellId) return "Unknown";
  return SUMMONER_SPELL_NAMES[spellId] || `Spell ${spellId}`;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ championId: string }> }
) {
  try {
    const { championId } = await params;

    // Récupérer les participants pour ce champion
    const participants = await prisma.matchParticipant.findMany({
      where: {
        championId,
      },
      select: {
        summoner1Id: true,
        summoner2Id: true,
        win: true,
        match: {
          select: {
            queueId: true,
          },
        },
      },
      take: 1000, // Limiter pour performance
    });

    if (participants.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summonerSpells: [],
          runes: null,
          skillOrder: null,
        },
      });
    }

    // Analyser les sorts d'invocateur
    const summonerSpellStats = new Map<
      string,
      { picks: number; wins: number }
    >();

    for (const participant of participants) {
      const spell1 = participant.summoner1Id;
      const spell2 = participant.summoner2Id;

      if (spell1 && spell2) {
        // Trier les sorts pour avoir une clé unique (plus petit ID en premier)
        const sortedSpells = [spell1, spell2].sort((a, b) => a - b);
        const key = `${sortedSpells[0]}-${sortedSpells[1]}`;

        const current = summonerSpellStats.get(key) ?? { picks: 0, wins: 0 };
        current.picks++;
        if (participant.win) current.wins++;

        summonerSpellStats.set(key, current);
      }
    }

    const totalPicks = participants.length;
    const summonerSpells = Array.from(summonerSpellStats.entries())
      .map(([key, stats]) => {
        const [spell1Id, spell2Id] = key.split("-").map(Number);
        return {
          spell1Id,
          spell2Id,
          spell1Name: getSummonerSpellName(spell1Id),
          spell2Name: getSummonerSpellName(spell2Id),
          picks: stats.picks,
          wins: stats.wins,
          winRate: stats.picks > 0 ? stats.wins / stats.picks : 0,
          pickRate: totalPicks > 0 ? stats.picks / totalPicks : 0,
        };
      })
      .sort((a, b) => b.picks - a.picks)
      .slice(0, 5);

    // Pour l'instant, on retourne des données vides pour les runes et l'ordre des compétences
    // car ces données ne sont pas stockées dans la base de données
    // TODO: Ajouter le stockage des runes et de l'ordre des compétences

    return NextResponse.json({
      success: true,
      data: {
        summonerSpells,
        runes: null,
        skillOrder: null,
        totalMatches: participants.length,
      },
    });
  } catch (error) {
    logger.error("Erreur lors de la récupération des runes", error as Error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des données",
      },
      { status: 500 }
    );
  }
}


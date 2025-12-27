import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ItemBuildData {
  items: number[];
  wins: number;
  games: number;
  winRate: number;
}

interface BuildAnalysis {
  playerBuild: number[];
  optimalBuilds: ItemBuildData[];
  matchScore: number;
  suggestions: string[];
  commonItems: number[];
  unusualItems: number[];
}

/**
 * GET /api/builds/analyze?championId=X&items=1,2,3,4,5,6
 * Analyzes a player's build against optimal builds for a champion
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const championId = searchParams.get("championId");
    const itemsParam = searchParams.get("items");
    const queueId = searchParams.get("queueId");

    if (!championId) {
      return NextResponse.json(
        { success: false, error: "championId parameter required" },
        { status: 400 }
      );
    }

    // Parse player items
    const playerItems = itemsParam
      ? itemsParam
          .split(",")
          .map((i) => parseInt(i, 10))
          .filter((i) => !isNaN(i) && i > 0)
      : [];

    // Build the query for winning builds
    const whereClause: {
      championId: string;
      win: boolean;
      queueId?: number;
    } = {
      championId,
      win: true,
    };

    if (queueId) {
      const parsedQueueId = parseInt(queueId, 10);
      if (!isNaN(parsedQueueId)) {
        whereClause.queueId = parsedQueueId;
      }
    }

    // Fetch winning participants with this champion (last 100 games)
    const winningParticipants = await prisma.matchParticipant.findMany({
      where: whereClause,
      select: {
        item0: true,
        item1: true,
        item2: true,
        item3: true,
        item4: true,
        item5: true,
        item6: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    if (winningParticipants.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          playerBuild: playerItems,
          optimalBuilds: [],
          matchScore: 0,
          suggestions: ["Pas assez de donnees pour cette analyse"],
          commonItems: [],
          unusualItems: [],
          gamesAnalyzed: 0,
        },
      });
    }

    // Count item frequency across winning builds
    const itemFrequency = new Map<number, number>();
    const buildPatterns = new Map<string, ItemBuildData>();

    for (const participant of winningParticipants) {
      const items = [
        participant.item0,
        participant.item1,
        participant.item2,
        participant.item3,
        participant.item4,
        participant.item5,
      ]
        .filter((i): i is number => i !== null && i > 0)
        .sort((a, b) => a - b);

      // Count individual item frequency
      for (const item of items) {
        itemFrequency.set(item, (itemFrequency.get(item) ?? 0) + 1);
      }

      // Track build patterns (sorted items as key)
      const buildKey = items.join(",");
      if (buildPatterns.has(buildKey)) {
        const existing = buildPatterns.get(buildKey)!;
        existing.wins++;
        existing.games++;
      } else {
        buildPatterns.set(buildKey, {
          items,
          wins: 1,
          games: 1,
          winRate: 100,
        });
      }
    }

    // Get top 5 most common item builds
    const topBuilds = Array.from(buildPatterns.values())
      .sort((a, b) => b.games - a.games)
      .slice(0, 5)
      .map((b) => ({
        ...b,
        winRate: Math.round((b.wins / b.games) * 100),
      }));

    // Get most common items (appearing in >30% of winning games)
    const threshold = winningParticipants.length * 0.3;
    const commonItems = Array.from(itemFrequency.entries())
      .filter(([, count]) => count >= threshold)
      .sort((a, b) => b[1] - a[1])
      .map(([itemId]) => itemId);

    // Analyze player's build
    let matchScore = 0;
    const suggestions: string[] = [];
    const unusualItems: number[] = [];

    if (playerItems.length > 0) {
      // Calculate how many of player's items are in common items
      const playerCommonItems = playerItems.filter((item) =>
        commonItems.includes(item)
      );
      matchScore = Math.round(
        (playerCommonItems.length / Math.max(playerItems.length, 1)) * 100
      );

      // Find unusual items (not in top 50% frequency)
      const halfThreshold = winningParticipants.length * 0.15;
      for (const item of playerItems) {
        const freq = itemFrequency.get(item) ?? 0;
        if (freq < halfThreshold) {
          unusualItems.push(item);
        }
      }

      // Generate suggestions
      if (matchScore < 50) {
        suggestions.push("Votre build differe significativement des builds gagnants");
      }
      if (unusualItems.length > 0) {
        suggestions.push(
          `${unusualItems.length} item(s) inhabituel(s) dans votre build`
        );
      }
      if (matchScore >= 80) {
        suggestions.push("Excellent! Votre build correspond aux meta-builds");
      } else if (matchScore >= 60) {
        suggestions.push("Bon build, quelques optimisations possibles");
      }

      // Suggest missing core items
      const missingCoreItems = commonItems
        .slice(0, 3)
        .filter((item) => !playerItems.includes(item));
      if (missingCoreItems.length > 0) {
        suggestions.push(`Items core manquants dans votre build`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        playerBuild: playerItems,
        optimalBuilds: topBuilds,
        matchScore,
        suggestions,
        commonItems: commonItems.slice(0, 10),
        unusualItems,
        gamesAnalyzed: winningParticipants.length,
      },
    });
  } catch (error) {
    console.error("Error analyzing build:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze build" },
      { status: 500 }
    );
  }
}

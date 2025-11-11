import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  fetchChallengeConfig,
  fetchPlayerChallenges,
} from "@/lib/riot/challenges";
import { broadcastNotification } from "@/lib/server/notification-hub";
import type { NotificationPayload } from "@/types";

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const DEFAULT_REGION = "euw1";
const MAX_ACCOUNTS_PER_SYNC = 40;

const requestSchema = z
  .object({
    puuids: z.array(z.string().min(1)).optional(),
    limit: z.number().int().positive().max(MAX_ACCOUNTS_PER_SYNC).optional(),
    region: z.string().optional(),
  })
  .optional();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toDate = (value: unknown): Date | null => {
  if (typeof value === "number") {
    const timestamp = value > 1e12 ? value : value * 1000;
    return new Date(timestamp);
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed;
    }
  }
  return null;
};

export async function POST(request: Request) {
  try {
    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Clé API Riot non configurée" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => undefined);
    const params = requestSchema.parse(body);
    const limit = params?.limit ?? 10;

    const challengeConfig = await fetchChallengeConfig(
      RIOT_API_KEY,
      params?.region ?? DEFAULT_REGION
    );

    await prisma.$transaction(
      challengeConfig.map((config) =>
        prisma.challenge.upsert({
          where: { challengeId: config.id },
          update: {
            name: config.name,
            description: config.description,
            shortDescription: config.shortDescription,
            category: config.category,
            level: config.level,
            thresholds: config.thresholds ?? undefined,
            tags: config.tags?.join(",") ?? undefined,
            maxValue: config.maxValue ?? undefined,
          },
          create: {
            challengeId: config.id,
            name: config.name,
            description: config.description,
            shortDescription: config.shortDescription,
            category: config.category,
            level: config.level,
            thresholds: config.thresholds ?? undefined,
            tags: config.tags?.join(",") ?? undefined,
            maxValue: config.maxValue ?? undefined,
          },
        })
      )
    );

    const accounts = await (async () => {
      if (params?.puuids?.length) {
        return prisma.leagueOfLegendsAccount.findMany({
          where: { puuid: { in: params.puuids } },
          select: {
            id: true,
            puuid: true,
            riotRegion: true,
            User: { select: { id: true } },
          },
        });
      }
      return prisma.leagueOfLegendsAccount.findMany({
        select: {
          id: true,
          puuid: true,
          riotRegion: true,
          User: { select: { id: true } },
        },
        take: limit,
        orderBy: { updatedAt: "desc" },
      });
    })();

    const summary: Array<{ leagueAccountId: string; updated: number }> = [];
    let notificationsSent = 0;

    for (const account of accounts) {
      const playerData = await fetchPlayerChallenges(
        RIOT_API_KEY,
        account.riotRegion ?? DEFAULT_REGION,
        account.puuid
      );

      const seenIds: number[] = [];
      let updatedCount = 0;

      for (const challenge of playerData.challenges) {
        if (!challenge.challengeId) continue;
        seenIds.push(challenge.challengeId);
        const achievedAt = toDate(challenge.achievedTime);

        const previous = await prisma.playerChallenge.findUnique({
          where: {
            leagueAccountId_challengeId: {
              leagueAccountId: account.id,
              challengeId: challenge.challengeId,
            },
          },
          select: { currentLevel: true },
        });

        const currentLevel = challenge.level ?? "NONE";

        await prisma.playerChallenge.upsert({
          where: {
            leagueAccountId_challengeId: {
              leagueAccountId: account.id,
              challengeId: challenge.challengeId,
            },
          },
          update: {
            currentValue: challenge.value ?? 0,
            currentLevel,
            highestLevel:
              challenge.highestLevel ?? previous?.currentLevel ?? undefined,
            percentile: challenge.percentile ?? undefined,
            achievedTime: achievedAt ?? undefined,
            nextLevelValue: challenge.nextLevel ?? undefined,
            progress: challenge.progress ?? undefined,
            pointsEarned: challenge.pointsEarned ?? undefined,
            completedLevels: challenge.completedObjectives
              ? JSON.stringify(challenge.completedObjectives)
              : undefined,
            lastUpdatedByRiot: achievedAt ?? undefined,
          },
          create: {
            leagueAccountId: account.id,
            challengeId: challenge.challengeId,
            currentValue: challenge.value ?? 0,
            currentLevel,
            highestLevel: challenge.highestLevel ?? undefined,
            percentile: challenge.percentile ?? undefined,
            achievedTime: achievedAt ?? undefined,
            nextLevelValue: challenge.nextLevel ?? undefined,
            progress: challenge.progress ?? undefined,
            pointsEarned: challenge.pointsEarned ?? undefined,
            completedLevels: challenge.completedObjectives
              ? JSON.stringify(challenge.completedObjectives)
              : undefined,
            lastUpdatedByRiot: achievedAt ?? undefined,
          },
        });

        if (
          previous &&
          previous.currentLevel !== currentLevel &&
          currentLevel !== "NONE"
        ) {
          notificationsSent += 1;
          const payload: NotificationPayload = {
            id: crypto.randomUUID(),
            title: "Nouveau palier de défi",
            message: `Votre compte a atteint le palier ${currentLevel} pour le challenge ${challenge.challengeId}.`,
            variant: "success",
            createdAt: new Date().toISOString(),
          };
          broadcastNotification(payload);
        }

        updatedCount += 1;
      }

      await prisma.playerChallenge.deleteMany({
        where: {
          leagueAccountId: account.id,
          challengeId: { notIn: seenIds.length ? seenIds : [0] },
        },
      });

      summary.push({ leagueAccountId: account.id, updated: updatedCount });

      await wait(200);
    }

    return NextResponse.json({
      success: true,
      data: {
        accountsProcessed: accounts.length,
        notificationsSent,
        updatedChallenges: summary,
      },
    });
  } catch (error) {
    console.error("Challenge sync error", error);
    const message =
      error instanceof Error ? error.message : "Échec de la synchronisation";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

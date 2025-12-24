import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  fetchChallengeConfig,
  fetchPlayerChallenges,
} from "@/lib/riot/challenges";
import { broadcastNotification } from "@/lib/server/notification-hub";
import { logger } from "@/lib/logger";
import { errorResponse, handleApiError } from "@/lib/api-helpers";
import type { NotificationPayload } from "@/types";

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const DEFAULT_REGION = process.env.DEFAULT_RIOT_REGION ?? "euw1";
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
      return errorResponse("Clé API Riot non configurée", 500);
    }

    const body = await request.json().catch(() => undefined);
    const params = requestSchema.parse(body);

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

    const { ShardedLeagueAccounts } = await import(
      "@/lib/prisma-sharded-accounts"
    );

    const accounts = await (async () => {
      if (params?.puuids?.length) {
        // Chercher dans toutes les régions
        const accountsMap = await ShardedLeagueAccounts.findManyByPuuidsGlobal(
          params.puuids
        );
        // Note: On ne peut plus récupérer User directement, il faut faire une requête séparée
        const accountIds = Array.from(accountsMap.values()).map(
          (acc) => acc.id
        );
        const users = await prisma.user.findMany({
          where: { leagueAccountId: { in: accountIds } },
          select: { id: true, leagueAccountId: true },
        });
        const usersByAccountId = new Map(
          users.map((u) => [u.leagueAccountId!, u])
        );
        return Array.from(accountsMap.values()).map((acc) => ({
          id: acc.id,
          puuid: acc.puuid,
          riotRegion: acc.riotRegion,
          User: usersByAccountId.get(acc.id)
            ? [{ id: usersByAccountId.get(acc.id)!.id }]
            : [],
        }));
      }
      // Pour findMany sans puuids, on ne peut pas facilement récupérer depuis toutes les tables shardées
      // On retourne un tableau vide pour l'instant - cette fonctionnalité nécessiterait une refonte
      return [];
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

      // Récupérer tous les challenges existants pour ce compte en une seule requête
      const existingChallenges = await prisma.playerChallenge.findMany({
        where: {
          leagueAccountId: account.id,
        },
        select: {
          challengeId: true,
          currentLevel: true,
        },
      });

      const existingChallengesMap = new Map(
        existingChallenges.map((c) => [c.challengeId, c])
      );

      // Préparer tous les upserts à exécuter en batch
      const upsertPromises: Promise<unknown>[] = [];
      const newLevelNotifications: Array<{
        challengeId: number;
        currentLevel: string;
      }> = [];

      for (const challenge of playerData.challenges) {
        if (!challenge.challengeId) continue;
        seenIds.push(challenge.challengeId);
        const achievedAt = toDate(challenge.achievedTime);
        const previous = existingChallengesMap.get(challenge.challengeId);
        const currentLevel = challenge.level ?? "NONE";

        // Vérifier si on doit envoyer une notification
        if (
          previous &&
          previous.currentLevel !== currentLevel &&
          currentLevel !== "NONE"
        ) {
          newLevelNotifications.push({
            challengeId: challenge.challengeId,
            currentLevel,
          });
        }

        // Ajouter l'upsert à la liste
        upsertPromises.push(
          prisma.playerChallenge.upsert({
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
          })
        );
      }

      // Exécuter tous les upserts en parallèle
      await Promise.all(upsertPromises);

      // Envoyer les notifications
      for (const notification of newLevelNotifications) {
        const payload: NotificationPayload = {
          id: crypto.randomUUID(),
          title: "Nouveau palier de défi",
          message: `Votre compte a atteint le palier ${notification.currentLevel} pour le challenge ${notification.challengeId}.`,
          variant: "success",
          createdAt: new Date().toISOString(),
        };
        broadcastNotification(payload);
        notificationsSent += 1;
      }

      updatedCount = upsertPromises.length;

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
    logger.error("Erreur lors de la synchronisation des challenges", error as Error);
    return handleApiError(error, "Synchronisation des challenges", "external");
  }
}

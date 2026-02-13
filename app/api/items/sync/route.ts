import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getItemDataUrl, getVersionsUrl } from "@/constants/ddragon";
import { logger } from "@/lib/logger";
import { invalidateCachePrefix } from "@/lib/cache";
import { fetchWithTimeout } from "@/lib/timeout";
import { getEnv } from "@/lib/env";
import { requireAdmin } from "@/lib/auth-utils";
import { toError } from "@/lib/errors";

interface RiotItem {
  id: string;
  name: string;
  description?: string;
  plaintext?: string;
  image?: {
    full: string;
  };
  gold?: {
    base: number;
    total: number;
    sell: number;
  };
  tags?: string[];
  depth?: number;
  from?: string[];
  maps?: Record<string, boolean>;
  inStore?: boolean;
  requiredChampion?: string;
}

interface RiotItemData {
  [key: string]: RiotItem;
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const syncLogger = logger; // ou createLogger("items-sync")

  try {
    const env = getEnv();
    
    // Récupérer la version la plus récente de Data Dragon avec timeout
    const versionsResponse = await fetchWithTimeout(getVersionsUrl(), {}, env.API_TIMEOUT_MS);
    if (!versionsResponse.ok) {
      throw new Error("Impossible de récupérer les versions");
    }
    const versions: string[] = await versionsResponse.json();
    const latestVersion = versions[0];

    // Récupérer les données des items avec timeout
    const itemsResponse = await fetchWithTimeout(
      getItemDataUrl(latestVersion, "fr_FR"),
      {},
      env.API_TIMEOUT_MS
    );
    if (!itemsResponse.ok) {
      throw new Error("Impossible de récupérer les items");
    }
    const itemsData: { data: RiotItemData } = await itemsResponse.json();

    // Transformer et filtrer les items
    const items = Object.entries(itemsData.data).filter(([itemId, item]) => {
      // Ignorer les items avec ID spéciales (consommables, runes, etc.)
      return (
        item.name &&
        itemId !== "0" &&
        !itemId.startsWith("70") &&
        !itemId.startsWith("80") &&
        !itemId.startsWith("90")
      );
    });

    // Récupérer tous les items existants en une seule requête
    const existingItems = await prisma.item.findMany({
      where: {
        itemId: {
          in: items.map(([itemId]) => itemId),
        },
      },
      select: { itemId: true },
    });

    const existingItemIds = new Set(existingItems.map((item) => item.itemId));

    // Séparer les items à créer et à mettre à jour
    const itemsToCreate = items
      .filter(([itemId]) => !existingItemIds.has(itemId))
      .map(([itemId, item]) => ({
        itemId,
        name: item.name,
        description: item.description || null,
        plaintext: item.plaintext || null,
        image: item.image?.full || null,
        gold: item.gold ? JSON.stringify(item.gold) : null,
        tags: item.tags ? JSON.stringify(item.tags) : null,
        depth: item.depth || null,
        fromItems: item.from ? JSON.stringify(item.from) : null,
        maps: item.maps ? JSON.stringify(item.maps) : null,
        inStore: item.inStore ?? true,
        requiredChampion: item.requiredChampion || null,
      }));

    const itemsToUpdate = items.filter(([itemId]) => existingItemIds.has(itemId));

    // Créer les nouveaux items en batch (max 100 à la fois pour éviter les limites)
    let created = 0;
    const batchSize = 100;
    for (let i = 0; i < itemsToCreate.length; i += batchSize) {
      const batch = itemsToCreate.slice(i, i + batchSize);
      await prisma.item.createMany({
        data: batch,
        skipDuplicates: true,
      });
      created += batch.length;
    }

    // Mettre à jour les items existants en batch via $transaction
    const updateOps = itemsToUpdate.map(([itemId, item]) =>
      prisma.item.update({
        where: { itemId },
        data: {
          name: item.name,
          description: item.description || null,
          plaintext: item.plaintext || null,
          image: item.image?.full || null,
          gold: item.gold ? JSON.stringify(item.gold) : null,
          tags: item.tags ? JSON.stringify(item.tags) : null,
          depth: item.depth || null,
          fromItems: item.from ? JSON.stringify(item.from) : null,
          maps: item.maps ? JSON.stringify(item.maps) : null,
          inStore: item.inStore ?? true,
          requiredChampion: item.requiredChampion || null,
        },
      })
    );
    let updated = 0;
    for (let i = 0; i < updateOps.length; i += batchSize) {
      const batch = updateOps.slice(i, i + batchSize);
      await prisma.$transaction(batch);
      updated += batch.length;
    }

    // Invalider le cache des items
    invalidateCachePrefix("items:");

    const skipped = Object.entries(itemsData.data).length - items.length;

    syncLogger.info("Items synchronisés avec succès", {
      total: items.length,
      created,
      updated,
      skipped,
      version: latestVersion,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Items synchronisés avec succès",
        data: {
          total: items.length,
          created,
          updated,
          skipped,
          version: latestVersion,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Erreur lors de la synchronisation des items", toError(error));
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la synchronisation des items",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : "Erreur inconnue") : undefined,
      },
      { status: 500 }
    );
  }
}

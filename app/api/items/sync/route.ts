import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getItemDataUrl, getVersionsUrl } from "@/constants/ddragon";

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
}

interface RiotItemData {
  [key: string]: RiotItem;
}

export async function POST(request: Request) {
  try {
    // Récupérer la version la plus récente de Data Dragon
    const versionsResponse = await fetch(getVersionsUrl());
    if (!versionsResponse.ok) {
      throw new Error("Impossible de récupérer les versions");
    }
    const versions: string[] = await versionsResponse.json();
    const latestVersion = versions[0];

    // Récupérer les données des items
    const itemsResponse = await fetch(
      getItemDataUrl(latestVersion, "fr_FR")
    );
    if (!itemsResponse.ok) {
      throw new Error("Impossible de récupérer les items");
    }
    const itemsData: { data: RiotItemData } = await itemsResponse.json();

    // Transformer et insérer les items
    const items = Object.entries(itemsData.data);
    let created = 0;
    let skipped = 0;

    for (const [itemId, item] of items) {
      // Ignorer les items avec ID spéciales (consommables, runes, etc.)
      if (
        !item.name ||
        itemId === "0" ||
        itemId.startsWith("70") ||
        itemId.startsWith("80") ||
        itemId.startsWith("90")
      ) {
        skipped++;
        continue;
      }

      try {
        const existingItem = await prisma.item.findUnique({
          where: { itemId },
        });

        if (existingItem) {
          await prisma.item.update({
            where: { itemId },
            data: {
              name: item.name,
              description: item.description || null,
              plaintext: item.plaintext || null,
              image: item.image?.full || null,
              gold: item.gold ? JSON.stringify(item.gold) : null,
            },
          });
        } else {
          await prisma.item.create({
            data: {
              itemId,
              name: item.name,
              description: item.description || null,
              plaintext: item.plaintext || null,
              image: item.image?.full || null,
              gold: item.gold ? JSON.stringify(item.gold) : null,
            },
          });
          created++;
        }
      } catch (error) {
        console.error(`Erreur lors de la sauvegarde de ${item.name}:`, error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Items synchronisés avec succès",
        data: {
          total: items.length,
          created,
          skipped,
          version: latestVersion,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la synchronisation des items:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la synchronisation des items",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

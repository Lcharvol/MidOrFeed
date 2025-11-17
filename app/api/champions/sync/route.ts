import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getChampionDataUrl, getVersionsUrl } from "@/constants/ddragon";
import { logger } from "@/lib/logger";
import { invalidateCachePrefix } from "@/lib/cache";
import { fetchWithTimeout } from "@/lib/timeout";
import { getEnv } from "@/lib/env";

interface RiotChampion {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: {
    attack: number;
    defense: number;
    magic: number;
    difficulty: number;
  };
  stats: {
    hp: number;
    hpperlevel: number;
    mp: number;
    mpperlevel: number;
    movespeed: number;
    armor: number;
    armorperlevel: number;
    spellblock: number;
    spellblockperlevel: number;
    attackrange: number;
    hpregen: number;
    hpregenperlevel: number;
    mpregen: number;
    mpregenperlevel: number;
    crit: number;
    critperlevel: number;
    attackdamage: number;
    attackdamageperlevel: number;
    attackspeed: number;
    attackspeedperlevel: number;
  };
}

interface RiotChampionData {
  [key: string]: RiotChampion;
}

export async function POST(request: Request) {
  const syncLogger = logger; // ou createLogger("champions-sync")
  
  try {
    const env = getEnv();
    
    // Récupérer la version la plus récente de Data Dragon avec timeout
    const versionsResponse = await fetchWithTimeout(getVersionsUrl(), {}, env.API_TIMEOUT_MS);
    if (!versionsResponse.ok) {
      throw new Error("Impossible de récupérer les versions");
    }
    const versions: string[] = await versionsResponse.json();
    const latestVersion = versions[0];

    // Récupérer les données des champions avec timeout
    const championsResponse = await fetchWithTimeout(
      getChampionDataUrl(latestVersion, "en_US"),
      {},
      env.API_TIMEOUT_MS
    );
    if (!championsResponse.ok) {
      throw new Error("Impossible de récupérer les champions");
    }
    const championsData: { data: RiotChampionData } =
      await championsResponse.json();

    // Transformer les champions
    const champions = Object.values(championsData.data);
    
    // Récupérer tous les champions existants en une seule requête
    const existingChampions = await prisma.champion.findMany({
      where: {
        championId: {
          in: champions.map((champion) => champion.id),
        },
      },
      select: { championId: true },
    });

    const existingChampionIds = new Set(existingChampions.map((champ) => champ.championId));

    // Séparer les champions à créer et à mettre à jour
    const championsToCreate = champions
      .filter((champion) => !existingChampionIds.has(champion.id))
      .map((champion) => ({
        championId: champion.id,
        championKey: parseInt(champion.key, 10),
        name: champion.name,
        title: champion.title,
        blurb: champion.blurb,
        attack: champion.info.attack,
        defense: champion.info.defense,
        magic: champion.info.magic,
        difficulty: champion.info.difficulty,
        hp: champion.stats.hp,
        hpPerLevel: champion.stats.hpperlevel,
        mp: champion.stats.mp,
        mpPerLevel: champion.stats.mpperlevel,
        moveSpeed: champion.stats.movespeed,
        armor: champion.stats.armor,
        armorPerLevel: champion.stats.armorperlevel,
        spellBlock: champion.stats.spellblock,
        spellBlockPerLevel: champion.stats.spellblockperlevel,
        attackRange: champion.stats.attackrange,
        hpRegen: champion.stats.hpregen,
        hpRegenPerLevel: champion.stats.hpregenperlevel,
        mpRegen: champion.stats.mpregen,
        mpRegenPerLevel: champion.stats.mpregenperlevel,
        crit: champion.stats.crit,
        critPerLevel: champion.stats.critperlevel,
        attackDamage: champion.stats.attackdamage,
        attackDamagePerLevel: champion.stats.attackdamageperlevel,
        attackSpeed: champion.stats.attackspeed,
        attackSpeedPerLevel: champion.stats.attackspeedperlevel,
      }));

    const championsToUpdate = champions.filter((champion) => existingChampionIds.has(champion.id));

    // Créer les nouveaux champions en batch (max 50 à la fois pour éviter les limites)
    let created = 0;
    const batchSize = 50;
    for (let i = 0; i < championsToCreate.length; i += batchSize) {
      const batch = championsToCreate.slice(i, i + batchSize);
      await prisma.champion.createMany({
        data: batch,
        skipDuplicates: true,
      });
      created += batch.length;
    }

    // Mettre à jour les champions existants en batch
    let updated = 0;
    for (const champion of championsToUpdate) {
      try {
        await prisma.champion.update({
          where: { championId: champion.id },
          data: {
            championKey: parseInt(champion.key, 10),
            name: champion.name,
            title: champion.title,
            blurb: champion.blurb,
            attack: champion.info.attack,
            defense: champion.info.defense,
            magic: champion.info.magic,
            difficulty: champion.info.difficulty,
            hp: champion.stats.hp,
            hpPerLevel: champion.stats.hpperlevel,
            mp: champion.stats.mp,
            mpPerLevel: champion.stats.mpperlevel,
            moveSpeed: champion.stats.movespeed,
            armor: champion.stats.armor,
            armorPerLevel: champion.stats.armorperlevel,
            spellBlock: champion.stats.spellblock,
            spellBlockPerLevel: champion.stats.spellblockperlevel,
            attackRange: champion.stats.attackrange,
            hpRegen: champion.stats.hpregen,
            hpRegenPerLevel: champion.stats.hpregenperlevel,
            mpRegen: champion.stats.mpregen,
            mpRegenPerLevel: champion.stats.mpregenperlevel,
            crit: champion.stats.crit,
            critPerLevel: champion.stats.critperlevel,
            attackDamage: champion.stats.attackdamage,
            attackDamagePerLevel: champion.stats.attackdamageperlevel,
            attackSpeed: champion.stats.attackspeed,
            attackSpeedPerLevel: champion.stats.attackspeedperlevel,
          },
        });
        updated++;
      } catch (error) {
        syncLogger.error(`Erreur lors de la mise à jour de ${champion.name}`, error as Error, { championId: champion.id });
      }
    }

    // Invalider le cache des champions
    invalidateCachePrefix("champions:");

    syncLogger.info("Champions synchronisés avec succès", {
      total: champions.length,
      created,
      updated,
      version: latestVersion,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Champions synchronisés avec succès",
        data: {
          total: champions.length,
          created,
          updated,
          version: latestVersion,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Erreur lors de la synchronisation des champions", error as Error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la synchronisation des champions",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

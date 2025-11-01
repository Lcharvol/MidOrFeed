import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RiotChampion {
  id: string;
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
  try {
    // Récupérer la version la plus récente de Data Dragon
    const versionsResponse = await fetch(
      "https://ddragon.leagueoflegends.com/api/versions.json"
    );
    if (!versionsResponse.ok) {
      throw new Error("Impossible de récupérer les versions");
    }
    const versions: string[] = await versionsResponse.json();
    const latestVersion = versions[0];

    // Récupérer les données des champions
    const championsResponse = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/fr_FR/champion.json`
    );
    if (!championsResponse.ok) {
      throw new Error("Impossible de récupérer les champions");
    }
    const championsData: { data: RiotChampionData } =
      await championsResponse.json();

    // Transformer et insérer les champions
    const champions = Object.values(championsData.data);
    let created = 0;
    const updated = 0;

    for (const champion of champions) {
      try {
        await prisma.champion.upsert({
          where: { championId: champion.id },
          update: {
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
          create: {
            championId: champion.id,
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
        created++;
      } catch (error) {
        console.error(
          `Erreur lors de la sauvegarde de ${champion.name}:`,
          error
        );
      }
    }

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
    console.error("Erreur lors de la synchronisation des champions:", error);
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

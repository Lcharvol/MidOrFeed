import { NextResponse } from "next/server";
import { getItemImageUrl } from "@/constants/ddragon";
import { prisma } from "@/lib/prisma";

const BOOT_ITEM_IDS = new Set([
  "1001",
  "3006",
  "3009",
  "3020",
  "3047",
  "3111",
  "3117",
  "3158",
  "2422",
  "2423",
  "2424",
]);

const TRINKET_ITEM_IDS = new Set(["3340", "3341", "3363", "3364", "3365"]);
const EXCLUDED_ITEM_IDS = new Set(["2055"]);

type ItemAggregate = {
  picks: number;
  wins: number;
};

type BuildAggregate = {
  items: string[];
  picks: number;
  wins: number;
};

const normalizeItemId = (value: number | null) =>
  typeof value === "number" && value > 0 ? value.toString() : null;

const shouldExcludeItem = (itemId: string) =>
  TRINKET_ITEM_IDS.has(itemId) || EXCLUDED_ITEM_IDS.has(itemId);

const updateItemAggregate = (
  map: Map<string, ItemAggregate>,
  itemId: string,
  won: boolean
) => {
  const current = map.get(itemId) ?? { picks: 0, wins: 0 };
  map.set(itemId, {
    picks: current.picks + 1,
    wins: current.wins + (won ? 1 : 0),
  });
};

const updateBuildAggregate = (
  map: Map<string, BuildAggregate>,
  items: string[],
  won: boolean
) => {
  if (items.length === 0) {
    return;
  }
  const key = items.join("-");
  const current = map.get(key) ?? { items, picks: 0, wins: 0 };
  map.set(key, {
    items: current.items,
    picks: current.picks + 1,
    wins: current.wins + (won ? 1 : 0),
  });
};

const sortByPickRate = <T extends ItemAggregate | BuildAggregate>(
  entries: Array<[string, T]>
) =>
  entries
    .sort(([, a], [, b]) => {
      if (b.picks === a.picks) {
        return b.wins - a.wins;
      }
      return b.picks - a.picks;
    })
    .map(([key, value]) => ({ key, value }));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const championId = searchParams.get("championId")?.trim();

  if (!championId) {
    return NextResponse.json(
      {
        success: false,
        error: "championId requis",
      },
      { status: 400 }
    );
  }

  try {
    const participants = await prisma.matchParticipant.findMany({
      where: { championId },
      include: {
        match: {
          select: {
            gameCreation: true,
          },
        },
      },
      orderBy: {
        match: {
          gameCreation: "desc",
        },
      },
      take: 500,
    });

    if (participants.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          championId,
          sampleSize: 0,
          lastMatchAt: null,
          coreItems: [],
          situationalItems: [],
          bootOptions: [],
          popularBuilds: [],
        },
      });
    }

    const itemAggregates = new Map<string, ItemAggregate>();
    const bootAggregates = new Map<string, ItemAggregate>();
    const buildAggregates = new Map<string, BuildAggregate>();

    const lastMatchTimestamp = participants.reduce(
      (accumulator, participant) => {
        const timestamp = Number(participant.match?.gameCreation ?? 0);
        return timestamp > accumulator ? timestamp : accumulator;
      },
      0
    );

    participants.forEach((participant) => {
      const rawItems = [
        participant.item0,
        participant.item1,
        participant.item2,
        participant.item3,
        participant.item4,
        participant.item5,
        participant.item6,
      ];

      const normalizedItems = rawItems
        .map(normalizeItemId)
        .filter((value): value is string => Boolean(value));

      const filteredItems = normalizedItems.filter(
        (itemId) => !shouldExcludeItem(itemId)
      );

      const uniqueItems = Array.from(new Set(filteredItems));

      uniqueItems.forEach((itemId) => {
        if (BOOT_ITEM_IDS.has(itemId)) {
          updateItemAggregate(bootAggregates, itemId, participant.win ?? false);
          return;
        }
        updateItemAggregate(itemAggregates, itemId, participant.win ?? false);
      });

      const buildItems = uniqueItems
        .filter((itemId) => !BOOT_ITEM_IDS.has(itemId))
        .slice(0, 5)
        .sort();

      if (buildItems.length >= 3) {
        updateBuildAggregate(buildAggregates, buildItems, participant.win ?? false);
      }
    });

    const sampleSize = participants.length;
    const coreEntries = sortByPickRate(Array.from(itemAggregates.entries()));
    const bootEntries = sortByPickRate(Array.from(bootAggregates.entries()));
    const buildEntries = sortByPickRate(Array.from(buildAggregates.entries()));

    const itemIdSet = coreEntries
      .map(({ key }) => key)
      .concat(bootEntries.map(({ key }) => key))
      .concat(
        buildEntries.flatMap(({ value }) => value.items)
      );

    const uniqueItemIds = Array.from(new Set(itemIdSet));

    const itemRecords = await prisma.item.findMany({
      where: {
        itemId: {
          in: uniqueItemIds,
        },
      },
    });

    const itemMap = new Map(itemRecords.map((item) => [item.itemId, item]));

    const resolveItemReference = (itemId: string) => {
      const meta = itemMap.get(itemId);
      return {
        itemId,
        name: meta?.name ?? itemId,
        image: meta?.image ? getItemImageUrl(meta.image) : null,
      };
    };

    const toItemStat = (entry: { key: string; value: ItemAggregate }) => {
      const reference = resolveItemReference(entry.key);
      const pickRate =
        sampleSize > 0 ? entry.value.picks / sampleSize : 0;
      const winRate =
        entry.value.picks > 0 ? entry.value.wins / entry.value.picks : 0;
      return {
        ...reference,
        picks: entry.value.picks,
        wins: entry.value.wins,
        pickRate,
        winRate,
      };
    };

    const CORE_ITEMS_LIMIT = 4;
    const SITUATIONAL_ITEMS_LIMIT = 6;
    const BOOTS_LIMIT = 3;
    const BUILDS_LIMIT = 3;

    const coreItems = coreEntries.slice(0, CORE_ITEMS_LIMIT).map(toItemStat);
    const situationalItems = coreEntries
      .slice(CORE_ITEMS_LIMIT, CORE_ITEMS_LIMIT + SITUATIONAL_ITEMS_LIMIT)
      .map(toItemStat);
    const bootOptions = bootEntries
      .filter(({ key }) => key !== "1001")
      .slice(0, BOOTS_LIMIT)
      .map(toItemStat);

    const popularBuilds = buildEntries
      .filter(({ value }) => value.picks >= 3)
      .slice(0, BUILDS_LIMIT)
      .map(({ value }) => {
        const pickRate =
          sampleSize > 0 ? value.picks / sampleSize : 0;
        const winRate =
          value.picks > 0 ? value.wins / value.picks : 0;
        return {
          items: value.items.map(resolveItemReference),
          picks: value.picks,
          wins: value.wins,
          pickRate,
          winRate,
        };
      });

    return NextResponse.json({
      success: true,
      data: {
        championId,
        sampleSize,
        lastMatchAt:
          lastMatchTimestamp > 0
            ? new Date(lastMatchTimestamp).toISOString()
            : null,
        coreItems,
        situationalItems,
        bootOptions,
        popularBuilds,
      },
    });
  } catch (error) {
    console.error("[CHAMPION-BUILD] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Impossible de récupérer les builds du champion",
      },
      { status: 500 }
    );
  }
}



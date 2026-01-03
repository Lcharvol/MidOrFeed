import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getChampionSplashUrl } from "@/constants/ddragon";
import { buildSiteUrl } from "@/constants/site";

export const SITE_NAME = "Mid or Feed";

const buildUrl = (path: string) => buildSiteUrl(path);

export type CounterPicksPageParams = {
  slug?: string[];
};

const findChampion = async (identifier: string) => {
  const cleaned = identifier.trim();
  if (!cleaned) return null;

  const championById = await prisma.champion.findFirst({
    where: { championId: { equals: cleaned, mode: "insensitive" } },
  });

  if (championById) {
    return championById;
  }

  const championByName = await prisma.champion.findFirst({
    where: { name: { equals: cleaned.replace(/-/g, " "), mode: "insensitive" } },
  });

  return championByName;
};

export const generateMetadata = async ({
  params,
}: {
  params: Promise<CounterPicksPageParams>;
}): Promise<Metadata> => {
  const { slug } = await params;
  const slugId = slug?.[0];

  if (!slugId) {
    const title = "LoL Counter Picks - Meilleurs counters League of Legends | Mid or Feed";
    const description =
      "Trouvez les meilleurs counter picks LoL. Analyse de milliers de matchs pour vous recommander les counters parfaits contre chaque champion League of Legends. Find the best LoL counters.";
    const url = buildUrl("/counter-picks");

    return {
      title,
      description,
      keywords: [
        "lol counter",
        "counter lol",
        "counter picks lol",
        "league of legends counter",
        "lol counter pick",
        "counter champion lol",
        "meilleur counter lol",
        "best lol counter",
      ],
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        type: "article",
        siteName: SITE_NAME,
        locale: "fr_FR",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        site: "@MidOrFeed",
        creator: "@MidOrFeed",
      },
    };
  }

  const championId = decodeURIComponent(slugId);
  const champion =
    process.env.DATABASE_URL !== undefined
      ? await findChampion(championId)
      : null;
  const championName = champion?.name ?? championId;
  const resolvedChampionId = champion?.championId ?? championId;
  const canonicalPath = `/counter-picks/${encodeURIComponent(resolvedChampionId)}`;
  const canonicalUrl = buildUrl(canonicalPath);
  const ogImage = champion
    ? getChampionSplashUrl(champion.championId)
    : buildUrl("/logo.png");

  const title = `Counter ${championName} LoL - Meilleurs counters | ${SITE_NAME}`;
  const description = `Counter ${championName} : découvrez les meilleurs counters et comment battre ${championName} sur LoL. Statistiques et conseils basés sur des milliers de matchs. Best ${championName} counters in League of Legends.`;

  return {
    title,
    description,
    keywords: [
      `counter ${championName}`,
      `${championName} counter`,
      `lol counter ${championName}`,
      `${championName} counter pick`,
      `how to counter ${championName}`,
      `comment contrer ${championName}`,
      `meilleur counter ${championName}`,
      `best ${championName} counter`,
      `${championName} counters lol`,
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      siteName: SITE_NAME,
      locale: "fr_FR",
      images: [
        {
          url: ogImage,
          width: 1215,
          height: 717,
          alt: `Counter ${championName} - Meilleurs counters League of Legends`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      site: "@MidOrFeed",
      creator: "@MidOrFeed",
    },
  };
};

export { findChampion };

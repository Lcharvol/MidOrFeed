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
    const title = "Counter picks League of Legends | Mid or Feed";
    const description =
      "Découvrez les meilleurs counter picks League of Legends et optimisez vos drafts grâce à l’analyse Mid or Feed.";
    const url = buildUrl("/counter-picks");

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        type: "article",
        siteName: SITE_NAME,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
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

  const title = `Counter picks ${championName} | ${SITE_NAME}`;
  const description = `Analyse Mid or Feed : découvrez les meilleurs counter picks, statistiques et conseils pour vaincre ${championName} sur League of Legends.`;

  return {
    title,
    description,
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
          alt: `Illustration de ${championName} pour les counter picks`,
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

import type { Metadata } from "next";
import {
  computeChampionScore,
  resolveTier,
} from "@/app/tier-list/champions/utils";
import { getChampionDetails } from "@/lib/champions/get-champion-details";
import { getChampionSplashUrl } from "@/constants/ddragon";
import { buildSiteUrl } from "@/constants/site";
import { SITE_NAME } from "@/constants/seo";

export type ChampionPageParams = {
  championId: string;
};

export const generateMetadata = async ({
  params,
}: {
  params: Promise<ChampionPageParams>;
}): Promise<Metadata> => {
  const { championId } = await params;
  const details = await getChampionDetails(championId);

  if (!details) {
    const defaultTitle = `Champion ${championId} | ${SITE_NAME}`;
    const canonicalUrl = buildSiteUrl(
      `/champions/${encodeURIComponent(championId)}`
    );
    return {
      title: defaultTitle,
      description:
        "Retrouvez les statistiques complètes et les informations de ce champion League of Legends sur Mid or Feed.",
      alternates: { canonical: canonicalUrl },
    };
  }

  const { champion, stats } = details;
  const canonicalPath = `/champions/${encodeURIComponent(champion.championId)}`;
  const canonicalUrl = buildSiteUrl(canonicalPath);
  const splashUrl = getChampionSplashUrl(champion.championId);
  const tier = resolveTier(stats);
  const score = computeChampionScore(stats);

  const title = `${champion.name} LoL - Stats, Counter & Guide | ${SITE_NAME}`;
  const description = `Statistiques de ${champion.name} sur League of Legends : winrate, score global${score ? ` (${score.toFixed(1)})` : ""}, tier ${tier}. Guide, counters et builds pour ce personnage LoL.`;

  return {
    title,
    description,
    keywords: [
      `${champion.name} lol`,
      `${champion.name} league of legends`,
      `${champion.name} stats`,
      `${champion.name} counter`,
      `${champion.name} build`,
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      siteName: SITE_NAME,
      locale: "fr_FR",
      images: [
        {
          url: splashUrl,
          width: 1215,
          height: 717,
          alt: `Splash art de ${champion.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [splashUrl],
      site: "@MidOrFeed",
      creator: "@MidOrFeed",
    },
  };
};

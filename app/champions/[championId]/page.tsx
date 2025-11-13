import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveTier } from "@/app/tier-list/champions/utils";
import { getChampionDetails } from "@/lib/champions/get-champion-details";
import { getChampionAbilities } from "@/lib/champions/get-champion-abilities";
import { getChampionSplashUrl } from "@/constants/ddragon";
import { buildSiteUrl } from "@/constants/site";
import {
  SITE_NAME,
  type ChampionPageParams,
  generateMetadata as generateChampionMetadata,
} from "./metadata";
import { ChampionPageContent } from "./components/ChampionPageContent";
import { ChampionJsonLd } from "./components/ChampionJsonLd";

const buildUrl = (path: string) => buildSiteUrl(path);

type PageParams = ChampionPageParams;

export const revalidate = 3600;

export async function generateStaticParams(): Promise<PageParams[]> {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  const champions = await prisma.champion.findMany({
    select: { championId: true },
  });

  return champions.map(({ championId }) => ({ championId }));
}

export { generateChampionMetadata as generateMetadata };

const ChampionPage = async ({ params }: { params: Promise<PageParams> }) => {
  const { championId } = await params;
  const details = await getChampionDetails(championId);

  if (!details) {
    notFound();
  }

  const { champion, stats } = details;
  const championGrowth = await prisma.champion.findMany({
    select: { hp: true, hpPerLevel: true, mp: true, mpPerLevel: true },
  });

  const computeLevel18 = (base: number, perLevel: number) =>
    base + perLevel * 17;

  const hpReferenceValues = championGrowth.map(({ hp, hpPerLevel }) =>
    computeLevel18(hp, hpPerLevel)
  );
  const mpReferenceValues = championGrowth
    .filter(({ mp }) => mp !== null)
    .map(({ mp, mpPerLevel }) => computeLevel18(mp ?? 0, mpPerLevel ?? 0));

  const defaultHpReference = computeLevel18(champion.hp, champion.hpPerLevel);
  const defaultMpReference = computeLevel18(
    champion.mp ?? 0,
    champion.mpPerLevel ?? 0
  );

  const maxHpReference = hpReferenceValues.length
    ? Math.max(...hpReferenceValues)
    : defaultHpReference;
  const maxMpReference = mpReferenceValues.length
    ? Math.max(...mpReferenceValues)
    : Math.max(defaultMpReference, 1);
  const { createdAtIso, updatedAtIso, ...championEntity } = champion;
  const canonicalPath = `/champions/${encodeURIComponent(champion.championId)}`;
  const canonicalUrl = buildUrl(canonicalPath);
  const splashUrl = getChampionSplashUrl(champion.championId);
  const tier = resolveTier(stats);
  const abilities = await getChampionAbilities(champion.championId, "fr_FR");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${champion.name} - Analyse et statistiques`,
    description: `Analyse détaillée de ${champion.name} : statistiques, tier ${tier}, score global et informations essentielles via Mid or Feed.`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    datePublished: createdAtIso,
    dateModified: updatedAtIso,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: buildUrl("/logo.png"),
      },
    },
    image: splashUrl,
    keywords: [
      `${champion.name} guide`,
      `${champion.name} stats`,
      `${champion.name} tier`,
      "League of Legends",
      SITE_NAME,
    ],
  };

  return (
    <main
      className="container mx-auto space-y-12 py-12"
      aria-labelledby="champion-heading"
    >
      <ChampionJsonLd data={structuredData} />
      <ChampionPageContent
        champion={championEntity}
        stats={stats}
        splashUrl={splashUrl}
        abilities={abilities}
        maxHpReference={maxHpReference}
        maxMpReference={maxMpReference}
      />
    </main>
  );
};

export default ChampionPage;

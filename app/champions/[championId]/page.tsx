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

  try {
    const champions = await prisma.champion.findMany({
      select: { championId: true },
    });

    return champions.map(({ championId }) => ({ championId }));
  } catch (error) {
    // Si la base de données n'est pas accessible pendant le build (credentials invalides, etc.)
    // On retourne un tableau vide et on laissera Next.js générer les pages dynamiquement
    console.warn(
      "Failed to generate static params for champions, falling back to dynamic generation:",
      error
    );
    return [];
  }
}

export { generateChampionMetadata as generateMetadata };

const ChampionPage = async ({ params }: { params: Promise<PageParams> }) => {
  const { championId } = await params;
  const details = await getChampionDetails(championId);

  if (!details) {
    notFound();
  }

  const { champion, stats } = details;

  // Utiliser des agrégats SQL pour éviter de charger tous les champions (N+1 fix)
  // Calcul: HP at level 18 = hp + hpPerLevel * 17
  const [hpAggregates, mpAggregates] = await Promise.all([
    prisma.$queryRaw<[{ max_hp_18: number }]>`
      SELECT MAX("hp" + "hpPerLevel" * 17) as max_hp_18
      FROM "Champion"
    `,
    prisma.$queryRaw<[{ max_mp_18: number }]>`
      SELECT MAX("mp" + COALESCE("mpPerLevel", 0) * 17) as max_mp_18
      FROM "Champion"
      WHERE "mp" IS NOT NULL
    `,
  ]);

  const computeLevel18 = (base: number, perLevel: number) =>
    base + perLevel * 17;

  const defaultHpReference = computeLevel18(champion.hp, champion.hpPerLevel);
  const defaultMpReference = computeLevel18(
    champion.mp ?? 0,
    champion.mpPerLevel ?? 0
  );

  const maxHpReference = hpAggregates[0]?.max_hp_18 ?? defaultHpReference;
  const maxMpReference = mpAggregates[0]?.max_mp_18 ?? Math.max(defaultMpReference, 1);
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

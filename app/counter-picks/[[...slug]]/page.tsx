import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getChampionSplashUrl } from "@/constants/ddragon";
import { buildSiteUrl } from "@/constants/site";
import CounterPicksPageClient from "../CounterPicksPageClient";
import {
  SITE_NAME,
  type CounterPicksPageParams,
  generateMetadata as generateCounterPicksMetadata,
  findChampion,
} from "./metadata";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const buildUrl = (path: string) => buildSiteUrl(path);

type PageParams = CounterPicksPageParams;

type PageSearchParams = {
  championId?: string | string[];
};

export async function generateStaticParams(): Promise<PageParams[]> {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  try {
    const champions = await prisma.champion.findMany({
      select: { championId: true },
    });

    return champions.map(({ championId }) => ({ slug: [championId] }));
  } catch (error) {
    // Si la base de données n'est pas accessible pendant le build (credentials invalides, etc.)
    // On retourne un tableau vide et on laissera Next.js générer les pages dynamiquement
    console.warn(
      "Failed to generate static params for counter-picks, falling back to dynamic generation:",
      error
    );
    return [];
  }
}

export { generateCounterPicksMetadata as generateMetadata };

const CounterPicksPage = async ({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearchParams>;
}) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const slugId = resolvedParams.slug?.[0]
    ? decodeURIComponent(resolvedParams.slug[0])
    : "";

  const queryChampion = Array.isArray(resolvedSearchParams.championId)
    ? resolvedSearchParams.championId[0]
    : resolvedSearchParams.championId;

  if (
    !slugId &&
    typeof queryChampion === "string" &&
    queryChampion.length > 0
  ) {
    redirect(`/counter-picks/${encodeURIComponent(queryChampion)}`);
  }

  const championRecord =
    slugId && process.env.DATABASE_URL !== undefined
      ? await findChampion(slugId)
      : null;
  const initialChampionId = championRecord?.championId ?? slugId;
  const initialChampionName = championRecord?.name ?? (slugId || null);
  const canonicalPath = initialChampionId
    ? `/counter-picks/${encodeURIComponent(initialChampionId)}`
    : "/counter-picks";
  const canonicalUrl = buildUrl(canonicalPath);
  const championSplashUrl = initialChampionId
    ? getChampionSplashUrl(initialChampionId)
    : buildUrl("/logo.png");

  const structuredData = initialChampionId
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: `Counter picks ${initialChampionName ?? initialChampionId}`,
        description: `Conseils, statistiques et matchups efficaces pour contrer ${
          initialChampionName ?? initialChampionId
        } sur League of Legends.`,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": canonicalUrl,
        },
        datePublished: (championRecord?.createdAt ?? new Date()).toISOString(),
        dateModified: (championRecord?.updatedAt ?? new Date()).toISOString(),
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
          image: initialChampionName
            ? championSplashUrl
            : buildUrl("/logo.png"),
        },
        keywords: [
          `counter picks ${initialChampionName ?? initialChampionId}`,
          `comment contrer ${initialChampionName ?? initialChampionId}`,
          `${initialChampionName ?? initialChampionId} counters`,
          "League of Legends",
          SITE_NAME,
        ],
        articleSection: "League of Legends Counter Picks",
        image: championRecord ? championSplashUrl : buildUrl("/logo.png"),
      }
    : {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Counter picks League of Legends",
        description:
          "Analyse des meilleurs counter picks Mid or Feed pour League of Legends.",
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": canonicalUrl,
        },
        datePublished: new Date().toISOString(),
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
        keywords: ["counter picks", "League of Legends", SITE_NAME],
        articleSection: "League of Legends Counter Picks",
      };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <CounterPicksPageClient
        key={initialChampionId || "counter-root"}
        initialChampionId={initialChampionId}
        initialChampionName={initialChampionName}
      />
    </>
  );
};

export default CounterPicksPage;

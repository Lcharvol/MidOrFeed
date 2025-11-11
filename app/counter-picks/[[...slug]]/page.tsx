import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CounterPicksPageClient from "../CounterPicksPageClient";

const SITE_NAME = "Mid or Feed";
const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://mid-or-feed.com").replace(/\/$/, "");

const buildUrl = (path: string) =>
  path.startsWith("http")
    ? path
    : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

type PageParams = {
  slug?: string[];
};

type PageSearchParams = {
  championId?: string | string[];
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

export const revalidate = 3600;

export async function generateStaticParams(): Promise<PageParams[]> {
  const champions = await prisma.champion.findMany({
    select: { championId: true },
  });

  return champions.map(({ championId }) => ({ slug: [championId] }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slugId = resolvedParams.slug?.[0];

  const defaultTitle = "Counter picks League of Legends | Mid or Feed";
  const defaultDescription =
    "Découvrez comment contrer vos adversaires sur League of Legends grâce aux analyses Mid or Feed.";

  if (!slugId) {
    const canonicalUrl = buildUrl("/counter-picks");
    return {
      title: defaultTitle,
      description: defaultDescription,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: defaultTitle,
        description: defaultDescription,
        url: canonicalUrl,
        type: "website",
        siteName: SITE_NAME,
      },
      twitter: {
        card: "summary_large_image",
        title: defaultTitle,
        description: defaultDescription,
      },
    };
  }

  const championId = decodeURIComponent(slugId);
  const champion = await findChampion(championId);
  const championName = champion?.name ?? championId;
  const resolvedChampionId = champion?.championId ?? championId;
  const canonicalPath = `/counter-picks/${encodeURIComponent(resolvedChampionId)}`;
  const canonicalUrl = buildUrl(canonicalPath);
  const ogImage = champion
    ? `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.championId}_0.jpg`
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
          alt: `Illustration de ${championName} pour les counter picks` ,
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
}

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

  if (!slugId && typeof queryChampion === "string" && queryChampion.length > 0) {
    redirect(`/counter-picks/${encodeURIComponent(queryChampion)}`);
  }

  const championRecord = slugId ? await findChampion(slugId) : null;
  const initialChampionId = championRecord?.championId ?? slugId;
  const initialChampionName = championRecord?.name ?? (slugId || null);
  const canonicalPath = initialChampionId
    ? `/counter-picks/${encodeURIComponent(initialChampionId)}`
    : "/counter-picks";
  const canonicalUrl = buildUrl(canonicalPath);

  const structuredData = initialChampionId
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: `Counter picks ${initialChampionName ?? initialChampionId}`,
        description: `Conseils, statistiques et matchups efficaces pour contrer ${initialChampionName ?? initialChampionId} sur League of Legends.`,
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
        },
        keywords: [
          `counter picks ${initialChampionName ?? initialChampionId}`,
          `comment contrer ${initialChampionName ?? initialChampionId}`,
          `${initialChampionName ?? initialChampionId} counters`,
          "League of Legends",
          SITE_NAME,
        ],
        articleSection: "League of Legends Counter Picks",
        image: championRecord
          ? `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championRecord.championId}_0.jpg`
          : buildUrl("/logo.png"),
      }
    : {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Counter picks League of Legends",
        description: "Analyse des meilleurs counter picks Mid or Feed pour League of Legends.",
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



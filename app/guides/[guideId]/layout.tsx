import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildSiteUrl } from "@/constants/site";
import { getChampionSplashUrl } from "@/constants/ddragon";
import { JsonLd } from "@/components/JsonLd";

const SITE_NAME = "Mid or Feed";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ guideId: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ guideId: string }>;
}): Promise<Metadata> {
  const { guideId } = await params;

  const guide = await prisma.championGuide.findUnique({
    where: { id: guideId },
    select: {
      title: true,
      championId: true,
      introduction: true,
      role: true,
      patchVersion: true,
      authorName: true,
      author: { select: { name: true } },
    },
  });

  if (!guide) {
    return {
      title: "Guide non trouvé",
    };
  }

  const authorName = guide.authorName ?? guide.author?.name ?? "Anonyme";
  const description =
    guide.introduction?.slice(0, 160) ||
    `Guide ${guide.championId} ${guide.role || ""} par ${authorName}. Découvrez le build, les runes et les conseils pour maîtriser ${guide.championId}.`;

  const canonicalUrl = buildSiteUrl(`/guides/${guideId}`);
  const imageUrl = getChampionSplashUrl(guide.championId);

  return {
    title: `${guide.title} - Guide ${guide.championId}`,
    description,
    openGraph: {
      title: guide.title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
          width: 1215,
          height: 717,
          alt: `${guide.championId} Splash Art`,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function GuideLayout({ children, params }: LayoutProps) {
  const { guideId } = await params;

  const guide = await prisma.championGuide.findUnique({
    where: { id: guideId },
    select: {
      id: true,
      title: true,
      championId: true,
      introduction: true,
      role: true,
      patchVersion: true,
      authorName: true,
      score: true,
      upvotes: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { name: true } },
    },
  });

  if (!guide) {
    return <>{children}</>;
  }

  const authorName = guide.authorName ?? guide.author?.name ?? "Anonyme";
  const canonicalUrl = buildSiteUrl(`/guides/${guideId}`);
  const imageUrl = getChampionSplashUrl(guide.championId);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description:
      guide.introduction?.slice(0, 160) ||
      `Guide ${guide.championId} par ${authorName}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    datePublished: guide.createdAt.toISOString(),
    dateModified: guide.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: buildSiteUrl("/logo.png"),
      },
    },
    image: imageUrl,
    aggregateRating: guide.upvotes > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: Math.min(5, Math.max(1, 3 + guide.score / 10)),
          bestRating: 5,
          worstRating: 1,
          ratingCount: guide.upvotes,
        }
      : undefined,
    keywords: [
      `${guide.championId} guide`,
      `${guide.championId} build`,
      guide.role && `${guide.championId} ${guide.role}`,
      "League of Legends",
      guide.patchVersion && `patch ${guide.patchVersion}`,
    ].filter(Boolean),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
    </>
  );
}

import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/constants/site";
import { createLogger } from "@/lib/logger";

const logger = createLogger("sitemap");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();

  // Pages statiques principales
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/counter-picks`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tier-list/champions`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tier-list/items`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/compositions/popular`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Pages dynamiques pour chaque champion
  let championPages: MetadataRoute.Sitemap = [];

  try {
    const champions = await prisma.champion.findMany({
      select: {
        championId: true,
        updatedAt: true,
      },
    });

    // Pages counter-picks pour chaque champion (priorité haute pour SEO "lol counter")
    const counterPicksPages: MetadataRoute.Sitemap = champions.map((champion) => ({
      url: `${baseUrl}/counter-picks/${champion.championId}`,
      lastModified: champion.updatedAt || now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));

    // Pages champion detail
    const championDetailPages: MetadataRoute.Sitemap = champions.map((champion) => ({
      url: `${baseUrl}/champions/${champion.championId}`,
      lastModified: champion.updatedAt || now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    championPages = [...counterPicksPages, ...championDetailPages];
  } catch (error) {
    logger.warn("Failed to fetch champions", { error: String(error) });
  }

  return [...staticPages, ...championPages];
}

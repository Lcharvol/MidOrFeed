import { NextRequest, NextResponse } from "next/server";
import { REGION_TO_BASE_URL } from "@/constants/regions";
import { getEnv } from "@/lib/env";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { riotApiRequest } from "@/lib/riot-api";
import { CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";

interface ContentDto {
  locale: string;
  content: string;
}

interface UpdateDto {
  id: number;
  author: string;
  publish: boolean;
  publish_locations: string[];
  translations: ContentDto[];
  created_at: string;
  updated_at: string;
}

interface StatusDto {
  id: number;
  maintenance_status?: string;
  incident_severity?: string;
  titles: ContentDto[];
  updates: UpdateDto[];
  created_at: string;
  updated_at: string;
  archive_at?: string;
  platforms: string[];
}

interface PlatformDataDto {
  id: string;
  name: string;
  locales: string[];
  maintenances: StatusDto[];
  incidents: StatusDto[];
}

interface StatusResponse {
  success: boolean;
  data: {
    platform: string;
    platformName: string;
    hasIssues: boolean;
    maintenances: Array<{
      id: number;
      status: string;
      title: string;
      description: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    incidents: Array<{
      id: number;
      severity: string;
      title: string;
      description: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
  };
}

const getLocalizedContent = (contents: ContentDto[], preferredLocale: string = "fr_FR"): string | null => {
  // Try preferred locale first
  const preferred = contents.find((c) => c.locale === preferredLocale);
  if (preferred) return preferred.content;

  // Fallback to English
  const english = contents.find((c) => c.locale.startsWith("en"));
  if (english) return english.content;

  // Fallback to first available
  return contents[0]?.content || null;
};

const getLatestUpdate = (updates: UpdateDto[], preferredLocale: string = "fr_FR"): string | null => {
  if (!updates.length) return null;

  // Sort by created_at descending
  const sorted = [...updates].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const latest = sorted[0];
  return getLocalizedContent(latest.translations, preferredLocale);
};

/**
 * GET /api/riot/status - Get Riot server status for a region
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const env = getEnv();
    if (!env.RIOT_API_KEY) {
      throw new Error("RIOT_API_KEY est requis");
    }

    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get("region") || "euw1";
    const locale = searchParams.get("locale") || "fr_FR";

    const normalizedRegion = region.toLowerCase();
    const baseUrl = REGION_TO_BASE_URL[normalizedRegion];

    if (!baseUrl) {
      return NextResponse.json({ error: "Region invalide" }, { status: 400 });
    }

    // Fetch platform status - Note: these requests don't count against rate limits
    const statusResponse = await riotApiRequest<PlatformDataDto>(
      `${baseUrl}/lol/status/v4/platform-data`,
      {
        region: normalizedRegion,
        cacheKey: `riot:status:${normalizedRegion}`,
        cacheTTL: CacheTTL.SHORT, // 1 minute for status
      }
    );

    const data = statusResponse.data;

    // Transform maintenances
    const maintenances = data.maintenances.map((m) => ({
      id: m.id,
      status: m.maintenance_status || "unknown",
      title: getLocalizedContent(m.titles, locale) || "Maintenance",
      description: getLatestUpdate(m.updates, locale),
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    // Transform incidents
    const incidents = data.incidents.map((i) => ({
      id: i.id,
      severity: i.incident_severity || "info",
      title: getLocalizedContent(i.titles, locale) || "Incident",
      description: getLatestUpdate(i.updates, locale),
      createdAt: i.created_at,
      updatedAt: i.updated_at,
    }));

    const response: StatusResponse = {
      success: true,
      data: {
        platform: data.id,
        platformName: data.name,
        hasIssues: maintenances.length > 0 || incidents.length > 0,
        maintenances,
        incidents,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const statusLogger = createLogger("riot-status");
    statusLogger.error("Erreur lors de la recuperation du statut Riot", error as Error);
    return NextResponse.json(
      {
        error: "Erreur lors de la recuperation du statut",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

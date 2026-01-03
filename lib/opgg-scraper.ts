/**
 * Service de scraping OP.GG pour récupérer les données de rank
 * Alternative à l'API Riot quand on n'a pas de clé de production
 */

import { cache, CacheTTL } from "./cache";
import { createLogger } from "./logger";

const logger = createLogger("opgg-scraper");

// Mapping des régions vers les URLs OP.GG
const REGION_TO_OPGG: Record<string, string> = {
  euw1: "euw",
  eun1: "eune",
  na1: "na",
  kr: "kr",
  jp1: "jp",
  br1: "br",
  la1: "lan",
  la2: "las",
  oc1: "oce",
  tr1: "tr",
  ru: "ru",
  ph2: "ph",
  sg2: "sg",
  th2: "th",
  tw2: "tw",
  vn2: "vn",
};

export interface OpggRankData {
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface OpggPlayerData {
  solo: OpggRankData | null;
  flex: OpggRankData | null;
  gameName: string | null;
  tagLine: string | null;
  profileIconId: number | null;
  summonerLevel: number | null;
}

/**
 * Parse le tier depuis le texte OP.GG (ex: "Diamond 2" -> { tier: "DIAMOND", rank: "II" })
 */
const parseTierRank = (tierText: string): { tier: string; rank: string } | null => {
  const tierMap: Record<string, string> = {
    iron: "IRON",
    bronze: "BRONZE",
    silver: "SILVER",
    gold: "GOLD",
    platinum: "PLATINUM",
    emerald: "EMERALD",
    diamond: "DIAMOND",
    master: "MASTER",
    grandmaster: "GRANDMASTER",
    challenger: "CHALLENGER",
  };

  const rankMap: Record<string, string> = {
    "1": "I",
    "2": "II",
    "3": "III",
    "4": "IV",
    i: "I",
    ii: "II",
    iii: "III",
    iv: "IV",
  };

  const normalized = tierText.toLowerCase().trim();

  // Pour Master+, pas de division
  for (const [key, value] of Object.entries(tierMap)) {
    if (normalized === key || normalized.startsWith(key + " ")) {
      const parts = normalized.split(" ");
      const rank = parts[1] ? rankMap[parts[1].toLowerCase()] || "I" : "I";
      return { tier: value, rank };
    }
  }

  return null;
};

/**
 * Extrait les données de rank depuis le HTML d'OP.GG
 */
const parseOpggHtml = (html: string): OpggPlayerData => {
  const result: OpggPlayerData = {
    solo: null,
    flex: null,
    gameName: null,
    tagLine: null,
    profileIconId: null,
    summonerLevel: null,
  };

  try {
    // Extraire le nom du joueur (pattern: data-summoner-name="..." ou dans le titre)
    const nameMatch = html.match(/class="[^"]*summoner-name[^"]*"[^>]*>([^<]+)</i) ||
                      html.match(/<title>([^-]+) -/i);
    if (nameMatch) {
      const fullName = nameMatch[1].trim();
      const hashIndex = fullName.indexOf("#");
      if (hashIndex > 0) {
        result.gameName = fullName.substring(0, hashIndex).trim();
        result.tagLine = fullName.substring(hashIndex + 1).trim();
      } else {
        result.gameName = fullName;
      }
    }

    // Extraire le niveau
    const levelMatch = html.match(/class="[^"]*level[^"]*"[^>]*>(\d+)</i);
    if (levelMatch) {
      result.summonerLevel = parseInt(levelMatch[1], 10);
    }

    // Pattern pour trouver les sections de ranked
    // OP.GG structure: rechercher les blocs contenant "Ranked Solo" et "Ranked Flex"

    // Pattern générique pour extraire tier + LP + wins/losses
    const rankSectionPattern = /(ranked\s*solo|solo\s*queue|soloduo|ranked\s*flex|flex\s*queue)[^]*?(?:unranked|iron|bronze|silver|gold|platinum|emerald|diamond|master|grandmaster|challenger)\s*(?:i{1,3}|iv|[1-4])?\s*[^]*?(\d+)\s*(?:lp|points?)[^]*?(\d+)\s*w\s*(\d+)\s*l/gi;

    // Alternative: chercher les blocs de rank avec structure JSON dans le HTML
    const jsonDataMatch = html.match(/__NEXT_DATA__[^>]*>([^<]+)</);
    if (jsonDataMatch) {
      try {
        const jsonData = JSON.parse(jsonDataMatch[1]);
        // Naviguer dans la structure Next.js pour trouver les données
        const pageProps = jsonData?.props?.pageProps;
        if (pageProps?.data?.summoner_stat) {
          const stats = pageProps.data.summoner_stat;

          // Solo/Duo
          if (stats.ranked_solo_5x5) {
            const solo = stats.ranked_solo_5x5;
            result.solo = {
              tier: solo.tier?.toUpperCase() || "UNRANKED",
              rank: solo.division?.toString().replace(/\d/, (d: string) => ["", "I", "II", "III", "IV"][parseInt(d)] || d) || "I",
              lp: solo.lp || 0,
              wins: solo.win || 0,
              losses: solo.lose || 0,
              winRate: solo.win && solo.lose ? Math.round((solo.win / (solo.win + solo.lose)) * 1000) / 10 : 0,
            };
          }

          // Flex
          if (stats.ranked_flex_sr) {
            const flex = stats.ranked_flex_sr;
            result.flex = {
              tier: flex.tier?.toUpperCase() || "UNRANKED",
              rank: flex.division?.toString().replace(/\d/, (d: string) => ["", "I", "II", "III", "IV"][parseInt(d)] || d) || "I",
              lp: flex.lp || 0,
              wins: flex.win || 0,
              losses: flex.lose || 0,
              winRate: flex.win && flex.lose ? Math.round((flex.win / (flex.win + flex.lose)) * 1000) / 10 : 0,
            };
          }
        }
      } catch {
        // JSON parsing failed, continue with HTML parsing
      }
    }

    // Fallback: parsing HTML brut si JSON non disponible
    if (!result.solo && !result.flex) {
      // Chercher les patterns de tier dans le HTML
      const tierPatterns = [
        // Pattern 1: tier class avec texte
        /tier[^>]*>([^<]+)</gi,
        // Pattern 2: rank info
        /(?:diamond|platinum|gold|silver|bronze|iron|master|grandmaster|challenger)\s*(?:i{1,3}|iv|[1-4])?/gi,
      ];

      for (const pattern of tierPatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          const tierInfo = parseTierRank(match[1] || match[0]);
          if (tierInfo && !result.solo) {
            // Essayer de trouver LP et W/L à proximité
            const contextStart = Math.max(0, match.index! - 500);
            const contextEnd = Math.min(html.length, match.index! + 500);
            const context = html.substring(contextStart, contextEnd);

            const lpMatch = context.match(/(\d+)\s*(?:lp|points?)/i);
            const wlMatch = context.match(/(\d+)\s*w[^]*?(\d+)\s*l/i);

            result.solo = {
              tier: tierInfo.tier,
              rank: tierInfo.rank,
              lp: lpMatch ? parseInt(lpMatch[1], 10) : 0,
              wins: wlMatch ? parseInt(wlMatch[1], 10) : 0,
              losses: wlMatch ? parseInt(wlMatch[2], 10) : 0,
              winRate: 0,
            };

            if (result.solo.wins + result.solo.losses > 0) {
              result.solo.winRate = Math.round((result.solo.wins / (result.solo.wins + result.solo.losses)) * 1000) / 10;
            }
            break;
          }
        }
      }
    }
  } catch (error) {
    logger.error("Erreur parsing HTML OP.GG", error as Error);
  }

  return result;
};

/**
 * Récupère les données de rank depuis OP.GG
 */
export const fetchOpggRank = async (
  gameName: string,
  tagLine: string,
  region: string
): Promise<OpggPlayerData | null> => {
  const opggRegion = REGION_TO_OPGG[region.toLowerCase()];
  if (!opggRegion) {
    logger.warn(`Région non supportée par OP.GG: ${region}`);
    return null;
  }

  // Construire la clé de cache
  const cacheKey = `opgg:rank:${opggRegion}:${gameName}:${tagLine}`;

  // Vérifier le cache
  const cached = cache.get<OpggPlayerData>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // URL OP.GG pour le profil
    const encodedName = encodeURIComponent(`${gameName}-${tagLine}`);
    const url = `https://www.op.gg/summoners/${opggRegion}/${encodedName}`;

    logger.info(`Fetching OP.GG: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
      },
      next: { revalidate: 300 }, // Cache Next.js 5 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        logger.info(`Joueur non trouvé sur OP.GG: ${gameName}#${tagLine}`);
        return null;
      }
      throw new Error(`OP.GG returned ${response.status}`);
    }

    const html = await response.text();
    const data = parseOpggHtml(html);

    // Mettre en cache
    cache.set(cacheKey, data, CacheTTL.MEDIUM); // 5 minutes

    return data;
  } catch (error) {
    logger.error(`Erreur scraping OP.GG pour ${gameName}#${tagLine}`, error as Error);
    return null;
  }
};

/**
 * Récupère les données de rank via l'API interne OP.GG (si disponible)
 */
export const fetchOpggApi = async (
  gameName: string,
  tagLine: string,
  region: string
): Promise<OpggPlayerData | null> => {
  const opggRegion = REGION_TO_OPGG[region.toLowerCase()];
  if (!opggRegion) {
    return null;
  }

  const cacheKey = `opgg:api:${opggRegion}:${gameName}:${tagLine}`;

  const cached = cache.get<OpggPlayerData>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // OP.GG a une API interne qu'on peut essayer d'utiliser
    const encodedName = encodeURIComponent(`${gameName}#${tagLine}`);
    const apiUrl = `https://op.gg/api/v1.0/internal/bypass/summoners/${opggRegion}/${encodedName}/summary`;

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Origin": "https://www.op.gg",
        "Referer": "https://www.op.gg/",
      },
    });

    if (!response.ok) {
      // Fallback au scraping HTML
      return fetchOpggRank(gameName, tagLine, region);
    }

    const data = await response.json();

    const result: OpggPlayerData = {
      solo: null,
      flex: null,
      gameName: data.summoner?.game_name || gameName,
      tagLine: data.summoner?.tagline || tagLine,
      profileIconId: data.summoner?.profile_image_id || null,
      summonerLevel: data.summoner?.level || null,
    };

    // Parser les données de league
    if (data.summoner?.league_stats) {
      for (const league of data.summoner.league_stats) {
        const rankData: OpggRankData = {
          tier: league.tier?.toUpperCase() || "UNRANKED",
          rank: league.rank || "I",
          lp: league.lp || 0,
          wins: league.win || 0,
          losses: league.lose || 0,
          winRate: league.win && league.lose
            ? Math.round((league.win / (league.win + league.lose)) * 1000) / 10
            : 0,
        };

        if (league.queue_type === "RANKED_SOLO_5x5") {
          result.solo = rankData;
        } else if (league.queue_type === "RANKED_FLEX_SR") {
          result.flex = rankData;
        }
      }
    }

    cache.set(cacheKey, result, CacheTTL.MEDIUM);
    return result;
  } catch (error) {
    logger.warn(`API OP.GG failed, falling back to scraping`, { error });
    return fetchOpggRank(gameName, tagLine, region);
  }
};

/**
 * Configuration centralisée des régions Riot Games
 * Utilisée pour le sharding, les requêtes API, etc.
 */

/**
 * Liste de toutes les régions supportées par Riot Games
 * Ordre de priorité : régions les plus populaires en premier
 */
export const RIOT_REGIONS = [
  "euw1", // Europe West
  "eun1", // Europe Nordic & East
  "na1",  // North America
  "br1",  // Brazil
  "kr",   // Korea
  "jp1",  // Japan
  "ru",   // Russia
  "tr1",  // Turkey
  "la1",  // Latin America North
  "la2",  // Latin America South
  "oc1",  // Oceania
  "ph2",  // Philippines
  "sg2",  // Singapore
  "th2",  // Thailand
  "tw2",  // Taiwan
  "vn2",  // Vietnam
] as const;

export type RiotRegion = (typeof RIOT_REGIONS)[number];

/**
 * Vérifie si une région est valide
 */
export const isValidRegion = (region: string): region is RiotRegion => {
  return RIOT_REGIONS.includes(region.toLowerCase() as RiotRegion);
};

/**
 * Normalise une région (lowercase)
 */
export const normalizeRegion = (region: string): string => {
  return region.toLowerCase();
};

/**
 * Régions principales (les plus utilisées)
 * Utilisées pour les requêtes prioritaires
 */
export const MAIN_REGIONS: RiotRegion[] = [
  "euw1",
  "eun1",
  "na1",
  "br1",
  "kr",
  "jp1",
  "ru",
  "tr1",
];


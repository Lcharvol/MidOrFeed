// Centralized DDragon version and image helpers
export const DDRAGON_BASE_URL = "https://ddragon.leagueoflegends.com";

export const DDRAGON_VERSION = "15.21.1";

const joinSegments = (segments: string[]) =>
  segments
    .filter(Boolean)
    .map((segment, index) =>
      index === 0 ? segment.replace(/\/$/, "") : segment.replace(/^\/+/, "")
    )
    .join("/");

export const buildDdragonUrl = (...segments: string[]) =>
  joinSegments([DDRAGON_BASE_URL, ...segments]);

export const getVersionsUrl = () => buildDdragonUrl("api", "versions.json");

export const getChampionDataUrl = (version: string, locale: string) =>
  buildDdragonUrl("cdn", version, "data", locale, "champion.json");

export const getChampionDetailDataUrl = (
  championId: string,
  version = DDRAGON_VERSION,
  locale = "fr_FR"
) =>
  buildDdragonUrl(
    "cdn",
    version,
    "data",
    locale,
    "champion",
    `${championId}.json`
  );

export const getItemDataUrl = (version: string, locale: string) =>
  buildDdragonUrl("cdn", version, "data", locale, "item.json");

export const getSummonerSpellDataUrl = (version: string, locale: string) =>
  buildDdragonUrl("cdn", version, "data", locale, "summoner.json");

export const getRunesDataUrl = (version: string, locale: string) =>
  buildDdragonUrl("cdn", version, "data", locale, "runesReforged.json");

export const getRuneImageUrl = (path: string) =>
  buildDdragonUrl("cdn", "img", path);

export const getSummonerSpellImageUrl = (
  spellImage: string,
  version = DDRAGON_VERSION
) => buildDdragonUrl("cdn", version, "img", "spell", spellImage);

export const getChampionImageUrl = (
  championName: string,
  version = DDRAGON_VERSION
) => buildDdragonUrl("cdn", version, "img", "champion", `${championName}.png`);

export const getChampionSplashUrl = (championId: string, skinIndex = 0) =>
  buildDdragonUrl(
    "cdn",
    "img",
    "champion",
    "splash",
    `${championId}_${skinIndex}.jpg`
  );

export const getProfileIconUrl = (
  iconId: number | string,
  version = DDRAGON_VERSION
) => buildDdragonUrl("cdn", version, "img", "profileicon", `${iconId}.png`);

export const getSpellImageUrl = (
  spellImage: string,
  version = DDRAGON_VERSION
) => buildDdragonUrl("cdn", version, "img", "spell", spellImage);

export const getPassiveImageUrl = (
  passiveImage: string,
  version = DDRAGON_VERSION
) => buildDdragonUrl("cdn", version, "img", "passive", passiveImage);

export const getItemImageUrl = (image: string, version = DDRAGON_VERSION) =>
  buildDdragonUrl("cdn", version, "img", "item", image);

// Tier/Rank icons - utilise les images locales depuis /public/ranks
export const getTierIconUrl = (
  tier: string,
  rank?: string | null,
  size: "medals" | "medals_mini" = "medals"
) => {
  // Mapping des noms de tier vers les noms de fichiers
  const tierMap: Record<string, string> = {
    IRON: "Iron",
    BRONZE: "Bronze",
    SILVER: "Silver",
    GOLD: "Gold",
    PLATINUM: "Platinum",
    EMERALD: "Emerald",
    DIAMOND: "Diamond",
    MASTER: "Master",
    GRANDMASTER: "Grandmaster",
    CHALLENGER: "Challenger",
  };

  const tierName = tierMap[tier] || tier;
  
  // Toutes les images sont dans /public/ranks avec le format "Rank=*.png"
  // Format: /ranks/Rank=Emerald.png
  return `/ranks/Rank=${tierName}.png`;
};

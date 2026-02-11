export const DDRAGON_BASE_URL = "https://ddragon.leagueoflegends.com";
export const DDRAGON_VERSION = "15.21.1";

export const getChampionDataUrl = (version = DDRAGON_VERSION, locale = "en_US") =>
  `${DDRAGON_BASE_URL}/cdn/${version}/data/${locale}/champion.json`;

export const getChampionImageUrl = (championId: string, version = DDRAGON_VERSION) =>
  `${DDRAGON_BASE_URL}/cdn/${version}/img/champion/${championId}.png`;

export const getProfileIconUrl = (iconId: number, version = DDRAGON_VERSION) =>
  `${DDRAGON_BASE_URL}/cdn/${version}/img/profileicon/${iconId}.png`;

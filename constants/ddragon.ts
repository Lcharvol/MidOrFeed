// Centralized DDragon version and image helpers
export const DDRAGON_VERSION = "15.21.1";

export const getChampionImageUrl = (
  championId: string,
  version = DDRAGON_VERSION
) =>
  `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championId}.png`;

export const getProfileIconUrl = (
  iconId: number | string,
  version = DDRAGON_VERSION
) =>
  `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;

export const getItemImageUrl = (image: string, version = DDRAGON_VERSION) =>
  `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${image}`;

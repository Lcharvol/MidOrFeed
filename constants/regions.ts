// Routing mapping for Riot APIs
export const REGION_TO_ROUTING: Record<string, string> = {
  // Europe
  euw1: "europe",
  eun1: "europe",
  tr1: "europe",
  ru: "europe",
  // Americas
  na1: "americas",
  la1: "americas",
  la2: "americas",
  br1: "americas",
  // Asia
  kr: "asia",
  jp1: "asia",
  oc1: "asia",
  ph2: "asia",
  sg2: "asia",
  th2: "asia",
  tw2: "asia",
  vn2: "asia",
};

export const normalizeRegion = (region: string) => region.toLowerCase();
export const getRoutingForRegion = (region: string) =>
  REGION_TO_ROUTING[normalizeRegion(region)];

// Platform base URLs per region for Summoner-v4 endpoints
export const REGION_TO_BASE_URL: Record<string, string> = {
  euw1: "https://euw1.api.riotgames.com",
  eun1: "https://eun1.api.riotgames.com",
  tr1: "https://tr1.api.riotgames.com",
  ru: "https://ru.api.riotgames.com",
  na1: "https://na1.api.riotgames.com",
  la1: "https://la1.api.riotgames.com",
  la2: "https://la2.api.riotgames.com",
  br1: "https://br1.api.riotgames.com",
  kr: "https://kr.api.riotgames.com",
  jp1: "https://jp1.api.riotgames.com",
  oc1: "https://oc1.api.riotgames.com",
  ph2: "https://ph2.api.riotgames.com",
  sg2: "https://sg2.api.riotgames.com",
  th2: "https://th2.api.riotgames.com",
  tw2: "https://tw2.api.riotgames.com",
  vn2: "https://vn2.api.riotgames.com",
};

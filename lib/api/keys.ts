export const apiKeys = {
  champions: () => "/api/champions/list",
  championStats: () => "/api/champions/stats",
  matches: (params?: { puuid?: string }) =>
    params?.puuid ? `/api/matches/list?puuid=${params.puuid}` : "/api/matches/list",
  counterPicks: (championId: string) => `/api/counter-picks?championId=${championId}`,
  compositionsPopular: () => "/api/compositions/popular",
  riotVersions: () => "/api/riot/versions",
  riotVersionsSync: () => "/api/admin/riot/versions",
};

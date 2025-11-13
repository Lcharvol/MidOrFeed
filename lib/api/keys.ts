export const apiKeys = {
  champions: () => "/api/champions/list",
  championStats: () => "/api/champions/stats",
  matches: (params?: { puuid?: string }) =>
    params?.puuid ? `/api/matches/list?puuid=${params.puuid}` : "/api/matches/list",
  counterPicks: (championId: string) => `/api/counter-picks?championId=${championId}`,
  championBuild: (championId: string) => `/api/champions/build?championId=${championId}`,
  championAdvice: (championId: string) => `/api/champions/advice?championId=${championId}`,
  championAdviceVote: () => `/api/champions/advice/vote`,
  compositionsPopular: () => "/api/compositions/popular",
  riotVersions: () => "/api/riot/versions",
  riotVersionsSync: () => "/api/admin/riot/versions",
};

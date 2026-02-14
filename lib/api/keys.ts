export const apiKeys = {
  champions: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) {
      searchParams.set("page", params.page.toString());
    }
    if (params?.limit) {
      searchParams.set("limit", params.limit.toString());
    }
    const query = searchParams.toString();
    return `/api/champions/list${query ? `?${query}` : ""}`;
  },
  championStats: (params?: { rank?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.rank) searchParams.set("rank", params.rank);
    const query = searchParams.toString();
    return `/api/champions/stats${query ? `?${query}` : ""}`;
  },
  matches: (params?: { puuid?: string }) =>
    params?.puuid ? `/api/matches/list?puuid=${params.puuid}` : "/api/matches/list",
  counterPicks: (championId: string, mode?: "same_lane" | "global") =>
    `/api/counter-picks?championId=${championId}${mode ? `&mode=${mode}` : ""}`,
  championBuild: (championId: string) => `/api/champions/build?championId=${championId}`,
  championRunes: (championId: string) => `/api/champions/${encodeURIComponent(championId)}/runes`,
  championLeadership: (championId: string) => `/api/champions/${encodeURIComponent(championId)}/leadership`,
  championAdvice: (championId: string) => `/api/champions/advice?championId=${championId}`,
  championAdviceVote: () => `/api/champions/advice/vote`,
  compositionsPopular: () => "/api/compositions/popular",
  riotVersions: () => "/api/riot/versions",
  riotVersionsSync: () => "/api/admin/riot/versions",
  summonerRanked: (puuid: string, region: string) =>
    `/api/summoners/${encodeURIComponent(puuid)}/ranked?region=${encodeURIComponent(region)}`,
  itemStats: () => "/api/items/stats",
  itemsList: (params?: { limit?: number; map?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.map) searchParams.set("map", params.map);
    const query = searchParams.toString();
    return `/api/items/list${query ? `?${query}` : ""}`;
  },
  draftAnalyze: () => "/api/draft/analyze",
  draftSave: () => "/api/draft/save",
  draftHistory: (limit = 30) => `/api/draft/history?limit=${limit}`,
  patches: () => "/api/patches",
  championStatsByPatch: (patch: string, rank?: string) => {
    const searchParams = new URLSearchParams();
    searchParams.set("patch", patch);
    if (rank) searchParams.set("rank", rank);
    return `/api/champions/stats/by-patch?${searchParams.toString()}`;
  },
};

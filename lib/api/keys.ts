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
  championStats: () => "/api/champions/stats",
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
};

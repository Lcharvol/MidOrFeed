export interface PublicUser {
  id: string;
  email: string | null;
  name: string | null;
  leagueAccountId: string | null;
}

export interface LeagueAccount {
  puuid: string;
  riotRegion: string;
  riotGameName?: string | null;
  riotTagLine?: string | null;
  summonerLevel?: number | null;
  profileIconId?: number | null;
}



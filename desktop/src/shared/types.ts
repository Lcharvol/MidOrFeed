// LCU Connection types
export interface LCUCredentials {
  port: number;
  password: string;
  protocol: string;
  pid: number;
}

export type LCUConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Game flow phases
export type GameFlowPhase =
  | 'None'
  | 'Lobby'
  | 'Matchmaking'
  | 'ReadyCheck'
  | 'ChampSelect'
  | 'GameStart'
  | 'InProgress'
  | 'WaitingForStats'
  | 'PreEndOfGame'
  | 'EndOfGame';

// Champion Select types
export interface ChampSelectSession {
  myTeam: ChampSelectMember[];
  theirTeam: ChampSelectMember[];
  bans: { championId: number; isAllyBan: boolean }[];
  timer: {
    phase: string;
    timeRemaining: number;
    totalTimeInPhase: number;
  };
  localPlayerCellId: number;
  isSpectating: boolean;
}

export interface ChampSelectMember {
  cellId: number;
  championId: number;
  championPickIntent: number;
  summonerId: number;
  assignedPosition: string;
  spell1Id: number;
  spell2Id: number;
  team: number;
}

// Summoner types
export interface CurrentSummoner {
  summonerId: number;
  puuid: string;
  displayName: string;
  gameName: string;
  tagLine: string;
  profileIconId: number;
  summonerLevel: number;
}

// Champion data from API
export interface ChampionData {
  id: number;
  name: string;
  winRate: number;
  pickRate: number;
  banRate: number;
  tier: string;
}

// Build data
export interface BuildData {
  championId: number;
  role: string;
  runes: RunePage;
  items: ItemBuild;
  skillOrder: string[];
}

export interface RunePage {
  name: string;
  primaryStyleId: number;
  subStyleId: number;
  selectedPerkIds: number[];
}

export interface ItemBuild {
  starter: number[];
  core: number[];
  situational: number[];
  boots: number[];
}

// IPC Events
export interface IPCEvents {
  // Main -> Renderer
  'lcu:status': LCUConnectionStatus;
  'lcu:gameflow': GameFlowPhase;
  'lcu:champselect': ChampSelectSession | null;
  'lcu:summoner': CurrentSummoner | null;

  // Renderer -> Main
  'lcu:reconnect': void;
  'overlay:toggle': void;
  'runes:import': RunePage;
  'app:quit': void;
}

// App settings
export interface AppSettings {
  autoLaunch: boolean;
  minimizeToTray: boolean;
  overlayEnabled: boolean;
  overlayPosition: { x: number; y: number };
  overlayOpacity: number;
  language: 'en' | 'fr';
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoLaunch: false,
  minimizeToTray: true,
  overlayEnabled: true,
  overlayPosition: { x: 100, y: 100 },
  overlayOpacity: 0.9,
  language: 'fr',
};

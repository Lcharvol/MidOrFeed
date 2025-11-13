export type ChampionId = string;

export interface ChampionEntity {
  id: string;
  championId: string;
  championKey?: number;
  name: string;
  title: string;
  blurb: string | null;
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
  hp: number;
  hpPerLevel: number;
  mp: number | null;
  mpPerLevel: number | null;
  moveSpeed: number;
  armor: number;
  armorPerLevel: number;
  spellBlock: number;
  spellBlockPerLevel: number;
  attackRange: number;
  hpRegen: number;
  hpRegenPerLevel: number;
  mpRegen: number | null;
  mpRegenPerLevel: number | null;
  crit: number;
  critPerLevel: number;
  attackDamage: number;
  attackDamagePerLevel: number;
  attackSpeed: number;
  attackSpeedPerLevel: number;
}

export interface ChampionSummary {
  championId: ChampionId;
  name: string;
}

export type QueueId = number;

export interface BuildItemReference {
  itemId: string;
  name: string;
  image: string | null;
}

export interface ChampionBuildItemStat extends BuildItemReference {
  picks: number;
  wins: number;
  pickRate: number;
  winRate: number;
}

export interface ChampionBuildVariant {
  items: BuildItemReference[];
  picks: number;
  wins: number;
  pickRate: number;
  winRate: number;
}

export interface ChampionBuildSummary {
  championId: ChampionId;
  sampleSize: number;
  lastMatchAt: string | null;
  coreItems: ChampionBuildItemStat[];
  situationalItems: ChampionBuildItemStat[];
  bootOptions: ChampionBuildItemStat[];
  popularBuilds: ChampionBuildVariant[];
}

export type ChampionAdviceVoteValue = -1 | 0 | 1;

export interface ChampionAdviceEntry {
  id: string;
  championId: ChampionId;
  authorId: string | null;
  authorName: string | null;
  content: string;
  score: number;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  updatedAt: string;
  viewerVote: ChampionAdviceVoteValue | null;
  language?: string | null;
  patchVersion?: string | null;
  canDelete?: boolean;
}

export interface ChampionAdviceSummary {
  championId: ChampionId;
  advices: ChampionAdviceEntry[];
}



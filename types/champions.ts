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



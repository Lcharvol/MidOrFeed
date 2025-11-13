import {
  DDRAGON_VERSION,
  getChampionDetailDataUrl,
  getPassiveImageUrl,
  getSpellImageUrl,
} from "@/constants/ddragon";

export type ChampionAbilitySlot = "P" | "Q" | "W" | "E" | "R";

export type ChampionAbility = {
  slot: ChampionAbilitySlot;
  name: string;
  description: string;
  icon: string;
  cooldown?: string | null;
  cost?: string | null;
  resource?: string | null;
};

const abilitySlots: ChampionAbilitySlot[] = ["Q", "W", "E", "R"];

const sanitizeChampionId = (identifier: string) =>
  identifier.replace(/\.json$/i, "").trim();

const extractChampionPayload = (
  payload: Record<string, any>,
  championId: string
) => {
  const directHit = payload?.[championId];
  if (directHit) return directHit;
  const fallbackEntry = Object.values(payload ?? {})[0];
  return fallbackEntry ?? null;
};

const fetchChampionPayload = async (
  championId: string,
  locale: string
) => {
  const response = await fetch(
    getChampionDetailDataUrl(championId, DDRAGON_VERSION, locale),
    {
      next: { revalidate: 3600 },
    }
  );

  if (!response.ok) {
    return null;
  }

  try {
    const json = await response.json();
    return extractChampionPayload(json?.data ?? {}, championId);
  } catch (error) {
    console.error("Unable to parse champion ability payload", error);
    return null;
  }
};

const normalizeDescription = (raw: string | null | undefined) =>
  raw?.trim() ?? "";

const mapPassive = (championData: any): ChampionAbility | null => {
  const passive = championData?.passive;
  if (!passive) return null;

  return {
    slot: "P",
    name: passive.name ?? "Passive",
    description: normalizeDescription(passive.description),
    icon: passive.image?.full
      ? getPassiveImageUrl(passive.image.full)
      : "",
  };
};

const mapSpells = (championData: any): ChampionAbility[] => {
  if (!Array.isArray(championData?.spells)) {
    return [];
  }

  return championData.spells.map((spell: any, index: number) => ({
    slot: abilitySlots[index] ?? "Q",
    name: spell?.name ?? `Sort ${abilitySlots[index] ?? "Q"}`,
    description: normalizeDescription(spell?.description ?? spell?.tooltip),
    icon: spell?.image?.full ? getSpellImageUrl(spell.image.full) : "",
    cooldown: spell?.cooldownBurn ?? null,
    cost: spell?.costBurn ?? null,
    resource: spell?.resource ?? null,
  }));
};

export const getChampionAbilities = async (
  championId: string,
  localePreference: string = "fr_FR"
): Promise<ChampionAbility[]> => {
  const normalizedId = sanitizeChampionId(championId);
  if (!normalizedId) return [];

  const localesToTry = [localePreference, "en_US"];

  for (const locale of localesToTry) {
    const payload = await fetchChampionPayload(normalizedId, locale);
    if (!payload) {
      continue;
    }

    const passive = mapPassive(payload);
    const spells = mapSpells(payload);

    return passive ? [passive, ...spells] : spells;
  }

  return [];
};

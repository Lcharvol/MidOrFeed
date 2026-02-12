import {
  DDRAGON_VERSION,
  getChampionDetailDataUrl,
  getPassiveImageUrl,
  getSpellImageUrl,
} from "@/constants/ddragon";
import { logger } from "@/lib/logger";

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

interface DDragonSpell {
  name?: string;
  description?: string;
  tooltip?: string;
  image?: { full?: string };
  cooldownBurn?: string;
  costBurn?: string;
  resource?: string;
}

interface DDragonChampionData {
  passive?: {
    name?: string;
    description?: string;
    image?: { full?: string };
  };
  spells?: DDragonSpell[];
}

const extractChampionPayload = (
  payload: Record<string, unknown>,
  championId: string
): DDragonChampionData | null => {
  const directHit = payload?.[championId] as DDragonChampionData | undefined;
  if (directHit) return directHit;
  const fallbackEntry = Object.values(payload ?? {})[0] as DDragonChampionData | undefined;
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
    logger.error("Unable to parse champion ability payload", error as Error);
    return null;
  }
};

const ALLOWED_TAGS = new Set(["br", "b", "i", "strong", "em", "span"]);

/** Sanitize HTML: keep only allowed tags, strip attributes except class */
const sanitizeHtml = (html: string): string => {
  return html.replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (match, tag: string, attrs: string) => {
    const lower = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(lower)) return "";
    // Self-closing <br />
    if (lower === "br") return "<br />";
    // Strip all attributes except class
    const classMatch = attrs.match(/class="([^"]*)"/i);
    const classAttr = classMatch ? ` class="${classMatch[1]}"` : "";
    return match.startsWith("</") ? `</${lower}>` : `<${lower}${classAttr}>`;
  });
};

const normalizeDescription = (raw: string | null | undefined): string => {
  const text = raw?.trim() ?? "";
  if (!text) return text;
  const formatted = text
    .replace(/<br\s*\/?>(\s)*/gi, "<br />")
    .replace(/\n+/g, "<br />")
    .replace(/ style="[^"]*"/gi, "");
  return sanitizeHtml(formatted);
};

const mapPassive = (championData: DDragonChampionData): ChampionAbility | null => {
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

const mapSpells = (championData: DDragonChampionData): ChampionAbility[] => {
  if (!Array.isArray(championData?.spells)) {
    return [];
  }

  return championData.spells.map((spell: DDragonSpell, index: number) => ({
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

import Image from "next/image";
import { cn } from "@/lib/utils";
import { getSpellImageUrl } from "@/constants/ddragon";

// Mapping des IDs de summoner spells vers leurs images
const SUMMONER_SPELL_MAP: Record<number, string> = {
  1: "SummonerBoost.png", // Cleanse
  3: "SummonerExhaust.png", // Exhaust
  4: "SummonerFlash.png", // Flash
  6: "SummonerHaste.png", // Ghost
  7: "SummonerHeal.png", // Heal
  11: "SummonerSmite.png", // Smite
  12: "SummonerTeleport.png", // Teleport
  13: "SummonerMana.png", // Clarity
  14: "SummonerIgnite.png", // Ignite
  21: "SummonerBarrier.png", // Barrier
  30: "SummonerPoroRecall.png", // Poro Recall
  31: "SummonerPoroThrow.png", // Poro Throw
  32: "SummonerMark.png", // Mark
  39: "SummonerSnowball.png", // Mark (ARAM)
};

const getSpellImageName = (
  spellId: number | null | undefined
): string | null => {
  if (!spellId || !SUMMONER_SPELL_MAP[spellId]) return null;
  return SUMMONER_SPELL_MAP[spellId];
};

export type SpellIconProps = {
  spellId?: number | null;
  /** alt text for accessibility */
  alt?: string;
  /** pixel size for the square container */
  size?: number;
  /** apply circular shape instead of rounded-xl */
  shape?: "rounded" | "circle";
  /** hide the border outline */
  showBorder?: boolean;
  /** expand to fill parent container */
  fluid?: boolean;
  /** override ddragon version if needed */
  version?: string;
  className?: string;
};

export const SpellIcon = ({
  spellId,
  alt,
  size = 48,
  shape = "rounded",
  showBorder = false,
  fluid = false,
  version,
  className,
}: SpellIconProps) => {
  const radiusClass = shape === "circle" ? "rounded-full" : "rounded-md";
  const borderClass = showBorder ? "border border-border/40" : "";

  const imageName = getSpellImageName(spellId);
  const src = imageName ? getSpellImageUrl(imageName, version) : null;

  const dimensions =
    !fluid && typeof size === "number"
      ? { width: size, height: size }
      : undefined;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-background/80",
        radiusClass,
        borderClass,
        fluid ? "w-full h-full" : undefined,
        className
      )}
      style={dimensions}
    >
      {src ? (
        fluid ? (
          <Image
            src={src}
            alt={alt ?? (spellId ? `Spell ${spellId}` : "Spell")}
            fill
            sizes="100vw"
            className="block h-full w-full object-cover object-center scale-[1.08]"
            unoptimized
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <Image
            src={src}
            alt={alt ?? (spellId ? `Spell ${spellId}` : "Spell")}
            width={size}
            height={size}
            className="block h-full w-full object-cover object-center scale-[1.08]"
            unoptimized
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground bg-background/30">
          ?
        </div>
      )}
    </div>
  );
};

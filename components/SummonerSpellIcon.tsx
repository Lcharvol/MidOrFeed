import Image from "next/image";
import { cn } from "@/lib/utils";
import { getSummonerSpellImageUrl } from "@/constants/ddragon";

export type SummonerSpellIconProps = {
  spellImage?: string | null;
  alt?: string;
  size?: number;
  shape?: "rounded" | "circle";
  showBorder?: boolean;
  fluid?: boolean;
  version?: string;
  className?: string;
};

export const SummonerSpellIcon = ({
  spellImage,
  alt,
  size = 40,
  shape = "rounded",
  showBorder = false,
  fluid = false,
  version,
  className,
}: SummonerSpellIconProps) => {
  const radiusClass = shape === "circle" ? "rounded-full" : "rounded-md";
  const borderClass = showBorder ? "border border-border/40" : "";

  const src = spellImage ? getSummonerSpellImageUrl(spellImage, version) : null;

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
            alt={alt ?? "Summoner Spell"}
            fill
            sizes="100vw"
            className="block h-full w-full object-cover object-center"
            unoptimized
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <Image
            src={src}
            alt={alt ?? "Summoner Spell"}
            width={size}
            height={size}
            className="block h-full w-full object-cover object-center"
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

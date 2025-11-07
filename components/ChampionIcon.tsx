import Image from "next/image";
import { cn } from "@/lib/utils";
import { getChampionImageUrl } from "@/constants/ddragon";

export type ChampionIconProps = {
  championId?: string | null;
  championKey?: string | number | null;
  championKeyToId?: Map<string, string>;
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

export const ChampionIcon = ({
  championId,
  championKey,
  championKeyToId,
  alt,
  size = 48,
  shape = "rounded",
  showBorder = false,
  fluid = false,
  version,
  className,
}: ChampionIconProps) => {
  const radiusClass = shape === "circle" ? "rounded-full" : "rounded-xl";
  const borderClass = showBorder ? "border border-border/40" : "";

  const slug = (() => {
    if (championId && championId.length > 0) return championId;
    if (championKey !== undefined && championKey !== null) {
      const keyStr = String(championKey);
      return championKeyToId?.get(keyStr) ?? keyStr;
    }
    return null;
  })();

  const src = slug ? getChampionImageUrl(slug, version) : null;

  const dimensions =
    !fluid && typeof size === "number"
      ? { width: size, height: size }
      : undefined;

  return (
    <div
      className={cn(
        "relative overflow-hidden",
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
            alt={alt ?? slug ?? "Champion"}
            fill
            sizes="100vw"
            className="block h-full w-full object-cover object-center scale-[1.08]"
          />
        ) : (
          <Image
            src={src}
            alt={alt ?? slug ?? "Champion"}
            width={size}
            height={size}
            className="block h-full w-full object-cover object-center scale-[1.08]"
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
          ?
        </div>
      )}
    </div>
  );
};

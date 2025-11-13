import Image from "next/image";
import { cn } from "@/lib/utils";
import { getItemImageUrl } from "@/constants/ddragon";

export type ItemIconProps = {
  itemId?: number | string | null;
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

export const ItemIcon = ({
  itemId,
  alt,
  size = 48,
  shape = "rounded",
  showBorder = false,
  fluid = false,
  version,
  className,
}: ItemIconProps) => {
  const radiusClass = shape === "circle" ? "rounded-full" : "rounded-md";
  const borderClass = showBorder ? "border border-border/40" : "";

  const imageName = itemId ? `${itemId}.png` : null;
  const src = imageName ? getItemImageUrl(imageName, version) : null;

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
            alt={alt ?? (itemId ? `Item ${itemId}` : "Item")}
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
            alt={alt ?? (itemId ? `Item ${itemId}` : "Item")}
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

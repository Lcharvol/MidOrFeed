import Image from "next/image";
import { cn } from "@/lib/utils";
import { getRuneImageUrl } from "@/constants/ddragon";

export type RuneIconProps = {
  runeIcon?: string | null;
  alt?: string;
  size?: number;
  className?: string;
};

export const RuneIcon = ({
  runeIcon,
  alt,
  size = 40,
  className,
}: RuneIconProps) => {
  const src = runeIcon ? getRuneImageUrl(runeIcon) : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full bg-background/80",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt ?? "Rune"}
          width={size}
          height={size}
          className="block h-full w-full object-cover object-center"
          unoptimized
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground bg-background/30">
          ?
        </div>
      )}
    </div>
  );
};

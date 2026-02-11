"use client";

export const StatCompareRow = ({
  label,
  value1,
  value2,
  icon,
  higherIsBetter = true,
  format = (v: number) => v.toFixed(1),
}: {
  label: string;
  value1: number;
  value2: number;
  icon: React.ReactNode;
  higherIsBetter?: boolean;
  format?: (v: number) => string;
}) => {
  const winner =
    value1 === value2
      ? null
      : higherIsBetter
        ? value1 > value2
          ? 1
          : 2
        : value1 < value2
          ? 1
          : 2;

  return (
    <div className="flex items-center gap-2 sm:gap-4 py-2 sm:py-3 border-b border-border/50 last:border-0">
      <div
        className={`flex-1 text-right font-semibold text-sm sm:text-lg ${winner === 1 ? "text-win" : "text-foreground"}`}
      >
        {format(value1)}
      </div>
      <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-[10px] sm:text-sm w-20 sm:w-36 justify-center shrink-0">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={`flex-1 text-left font-semibold text-sm sm:text-lg ${winner === 2 ? "text-win" : "text-foreground"}`}
      >
        {format(value2)}
      </div>
    </div>
  );
};

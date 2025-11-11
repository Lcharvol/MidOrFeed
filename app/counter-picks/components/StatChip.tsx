"use client";

type StatChipProps = {
  label: string;
  value: string;
};

export const StatChip = ({ label, value }: StatChipProps) => (
  <div className="rounded-full border border-border/60 bg-background/80 px-4 py-1.5 text-xs font-medium text-muted-foreground">
    <span className="mr-2 uppercase">{label}</span>
    <span className="text-foreground">{value}</span>
  </div>
);



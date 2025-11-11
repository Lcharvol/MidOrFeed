export const formatPercent = (value: number): string =>
  `${(Number.isFinite(value) ? value * 100 : 0).toFixed(1)}%`;

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);

export const formatDateTime = (timestamp: number): string =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(timestamp);

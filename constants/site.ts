export const DEFAULT_SITE_URL = "https://midorfeed.gg" as const;

export const getSiteUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_SITE_URL).replace(/\/$/, "");

export const buildSiteUrl = (path = "/") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
};

module.exports = {
  DEFAULT_SITE_URL,
  getSiteUrl,
  buildSiteUrl,
};

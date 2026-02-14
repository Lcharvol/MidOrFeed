import { buildSiteUrl } from "@/constants/site";

export const SITE_NAME = "Mid or Feed";
export const TWITTER_HANDLE = "@MidOrFeed";
export const DEFAULT_LOCALE = "fr_FR";
export const LOGO_URL_PATH = "/logo.webp";

/** Base OpenGraph partagé — merger avec les overrides de chaque page */
export const baseOpenGraph = {
  siteName: SITE_NAME,
  locale: DEFAULT_LOCALE,
} as const;

/** Base JSON-LD "isPartOf" WebSite — réutilisable dans tous les schemas */
export const websiteJsonLd = {
  "@type": "WebSite" as const,
  name: SITE_NAME,
  url: buildSiteUrl("/"),
};

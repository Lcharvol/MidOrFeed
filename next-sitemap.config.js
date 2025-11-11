const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://mid-or-feed.com").replace(/\/$/, "");

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  transform: async (config, path) => {
    const changefreq = path.startsWith("/counter-picks") ? "daily" : "weekly";
    const priority = path.startsWith("/counter-picks") ? 0.9 : 0.7;

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api", "/admin"],
      },
    ],
  },
};

import { MetadataRoute } from "next";
import { getSiteUrl } from "@/constants/site";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/settings", "/profile", "/favorites"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

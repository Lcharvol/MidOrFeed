import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
        pathname: "/cdn/**",
      },
    ],
    // Data Dragon images are served from Riot CDN and don't need optimization
    // We use dangerouslyAllowSVG for champion/item icons
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Only disable optimization for Data Dragon domain
    // Local images will still be optimized
    unoptimized: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;

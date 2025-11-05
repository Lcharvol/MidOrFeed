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
    // Désactiver l'optimisation pour éviter les erreurs 403 avec Data Dragon
    // Les images Data Dragon sont déjà optimisées et servies depuis un CDN
    unoptimized: true,
  },
};

export default nextConfig;

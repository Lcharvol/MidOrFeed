import type { Metadata } from "next";
import { buildSiteUrl } from "@/constants/site";
import { baseOpenGraph } from "@/constants/seo";

export const metadata: Metadata = {
  title: "Stats LoL - Rechercher un Joueur League of Legends",
  description:
    "Recherchez n'importe quel joueur League of Legends : statistiques détaillées, historique de matchs, champions joués et performances ranked.",
  keywords: [
    "league of legends stats",
    "stats league of legends",
    "statistiques lol",
    "lol stats",
    "league of legends player search",
    "lol summoner lookup",
    "lol profile",
  ],
  openGraph: {
    ...baseOpenGraph,
    title: "Stats LoL - Rechercher un Joueur League of Legends",
    description:
      "Recherchez n'importe quel joueur League of Legends : statistiques détaillées et performances ranked.",
  },
  alternates: {
    canonical: buildSiteUrl("/summoners"),
  },
};

export default function SummonersLayout({ children }: { children: React.ReactNode }) {
  return children;
}

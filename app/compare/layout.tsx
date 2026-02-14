import type { Metadata } from "next";
import { buildSiteUrl } from "@/constants/site";
import { baseOpenGraph } from "@/constants/seo";

export const metadata: Metadata = {
  title: "Comparer des Joueurs",
  description:
    "Comparez les statistiques de deux joueurs de League of Legends côte à côte : KDA, winrate, champions joués et plus.",
  keywords: ["lol compare", "compare lol players", "league of legends stats compare"],
  openGraph: {
    ...baseOpenGraph,
    title: "Comparer des Joueurs LoL",
    description:
      "Comparez les statistiques de deux joueurs de League of Legends côte à côte.",
  },
  alternates: {
    canonical: buildSiteUrl("/compare"),
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comparer des Joueurs",
  description:
    "Comparez les statistiques de deux joueurs de League of Legends côte à côte : KDA, winrate, champions joués et plus.",
  keywords: ["lol compare", "compare lol players", "league of legends stats compare"],
  openGraph: {
    title: "Comparer des Joueurs LoL",
    description:
      "Comparez les statistiques de deux joueurs de League of Legends côte à côte.",
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}

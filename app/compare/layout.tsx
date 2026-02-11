import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comparer des Joueurs",
  description:
    "Comparez les statistiques de deux joueurs de League of Legends côte à côte : KDA, winrate, champions joués et plus.",
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}

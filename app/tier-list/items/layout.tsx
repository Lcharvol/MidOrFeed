import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tier List Objets LoL",
  description:
    "Découvrez les meilleurs objets de League of Legends classés par winrate et taux de pick. Optimisez vos builds avec notre tier list objets.",
  keywords: ["lol items tier list", "best lol items", "league of legends items", "lol build"],
  openGraph: {
    title: "Tier List Objets LoL - Meilleurs Items League of Legends",
    description:
      "Les meilleurs objets de League of Legends classés par winrate et taux de pick.",
  },
};

export default function TierListItemsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

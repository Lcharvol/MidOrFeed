import type { Metadata } from "next";
import { buildSiteUrl } from "@/constants/site";
import { baseOpenGraph } from "@/constants/seo";

export const metadata: Metadata = {
  title: "Tier List Items LoL - Meilleurs Objets League of Legends",
  description:
    "Tier list des items League of Legends classés par winrate et pickrate. Trouvez les meilleurs objets LoL pour optimiser vos builds chaque patch.",
  keywords: [
    "item league of legends",
    "objets league of legends",
    "item lol",
    "lol items tier list",
    "best lol items",
    "league of legends items",
    "lol build",
  ],
  openGraph: {
    ...baseOpenGraph,
    title: "Tier List Items LoL - Meilleurs Objets League of Legends",
    description:
      "Tier list des items League of Legends classés par winrate et pickrate. Trouvez les meilleurs objets LoL pour optimiser vos builds.",
  },
  alternates: {
    canonical: buildSiteUrl("/tier-list/items"),
  },
};

export default function TierListItemsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

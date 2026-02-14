import type { Metadata } from "next";
import { buildSiteUrl } from "@/constants/site";
import { baseOpenGraph } from "@/constants/seo";

export const metadata: Metadata = {
  title: "Compositions LoL",
  description:
    "Créez, partagez et découvrez les meilleures compositions d'équipe pour League of Legends. Synergies, contre-compositions et méta actuelle.",
  keywords: [
    "composition league of legends",
    "comp lol",
    "lol team comp",
    "league of legends composition",
    "lol synergies",
    "team builder lol",
  ],
  openGraph: {
    ...baseOpenGraph,
    title: "Compositions LoL - Meilleures Team Comps",
    description:
      "Créez et découvrez les meilleures compositions d'équipe pour League of Legends.",
  },
  alternates: {
    canonical: buildSiteUrl("/compositions"),
  },
};

export default function CompositionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

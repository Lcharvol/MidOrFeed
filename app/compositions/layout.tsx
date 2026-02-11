import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compositions LoL",
  description:
    "Créez, partagez et découvrez les meilleures compositions d'équipe pour League of Legends. Synergies, contre-compositions et méta actuelle.",
  keywords: ["lol team comp", "league of legends composition", "lol synergies", "team builder lol"],
};

export default function CompositionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

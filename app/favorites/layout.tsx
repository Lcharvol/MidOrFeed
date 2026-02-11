import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Joueurs Favoris",
  description:
    "Suivez vos joueurs favoris de League of Legends. Consultez leurs dernières parties et leur progression en un coup d'oeil.",
};

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

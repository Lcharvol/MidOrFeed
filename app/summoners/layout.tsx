import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rechercher un Invocateur",
  description:
    "Recherchez n'importe quel joueur de League of Legends pour consulter ses statistiques, son historique de matchs et ses performances détaillées.",
  keywords: ["lol stats", "league of legends player search", "lol summoner lookup", "lol profile"],
};

export default function SummonersLayout({ children }: { children: React.ReactNode }) {
  return children;
}

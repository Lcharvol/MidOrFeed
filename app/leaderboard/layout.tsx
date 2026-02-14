import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { buildSiteUrl } from "@/constants/site";
import { baseOpenGraph } from "@/constants/seo";

export const metadata: Metadata = {
  title: "Classement LoL - Rank Challenger, Grandmaster & Master League of Legends",
  description:
    "Classement des meilleurs joueurs League of Legends : Challenger, Grandmaster et Master. Suivez les ranks, LP et winrates par région.",
  keywords: [
    "rank league of legends",
    "classement lol",
    "classement league of legends",
    "lol leaderboard",
    "league of legends challenger",
    "lol challenger players",
    "lol grandmaster",
    "lol master tier",
    "lol rankings",
  ],
  openGraph: {
    ...baseOpenGraph,
    title: "Classement LoL - Rank Challenger, Grandmaster & Master League of Legends",
    description:
      "Classement des meilleurs joueurs League of Legends : Challenger, Grandmaster et Master.",
    type: "website",
  },
  alternates: {
    canonical: buildSiteUrl("/leaderboard"),
  },
};

const leaderboardSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "League of Legends Ranked Leaderboard",
  description:
    "Ranking of the top League of Legends players in Challenger, Grandmaster, and Master tiers.",
  url: buildSiteUrl("/leaderboard"),
  itemListOrder: "https://schema.org/ItemListOrderDescending",
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={leaderboardSchema} />
      {children}
    </>
  );
}

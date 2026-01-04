import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "LoL Leaderboard - Challenger, Grandmaster & Master Rankings",
  description:
    "View the top League of Legends players in Challenger, Grandmaster, and Master tiers across all regions. Track LP, win rates, and rankings.",
  keywords: [
    "lol leaderboard",
    "league of legends challenger",
    "lol challenger players",
    "lol grandmaster",
    "lol master tier",
    "lol rankings",
  ],
  openGraph: {
    title: "LoL Leaderboard - Top Ranked Players",
    description:
      "Leaderboard of the best League of Legends players in Challenger, Grandmaster, and Master tiers.",
    type: "website",
  },
};

const leaderboardSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "League of Legends Ranked Leaderboard",
  description:
    "Ranking of the top League of Legends players in Challenger, Grandmaster, and Master tiers.",
  url: "https://midorfeed.gg/leaderboard",
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

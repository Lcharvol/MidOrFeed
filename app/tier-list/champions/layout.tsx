import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "LoL Champion Tier List - Best Champions to Play",
  description:
    "Discover the best League of Legends champions to play ranked with our data-driven tier list. Updated daily with win rates, pick rates, and tier rankings.",
  keywords: [
    "lol tier list",
    "league of legends tier list",
    "best lol champions",
    "lol champion rankings",
    "lol meta",
  ],
  openGraph: {
    title: "LoL Champion Tier List - Best Champions to Play",
    description:
      "Data-driven tier list with win rates, pick rates and rankings for all League of Legends champions.",
    type: "website",
  },
};

const tierListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "League of Legends Champion Tier List",
  description:
    "Ranking of League of Legends champions based on win rate, pick rate, and overall performance in ranked games.",
  url: "https://midorfeed.gg/tier-list/champions",
  itemListOrder: "https://schema.org/ItemListOrderDescending",
  numberOfItems: 168,
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the best champion to play in LoL?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The best champions vary by patch and role. Check our tier list for the current meta picks with the highest win rates across all ranks.",
      },
    },
    {
      "@type": "Question",
      name: "How is the tier list calculated?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our tier list is calculated using win rate, pick rate, ban rate, and performance data from thousands of ranked games, updated daily.",
      },
    },
  ],
};

export default function TierListChampionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={tierListSchema} />
      <JsonLd data={faqSchema} />
      {children}
    </>
  );
}

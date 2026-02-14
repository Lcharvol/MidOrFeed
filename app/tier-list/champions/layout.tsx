import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { buildSiteUrl } from "@/constants/site";
import { baseOpenGraph } from "@/constants/seo";

export const metadata: Metadata = {
  title: "Tier List Champions LoL - Meilleurs Champions League of Legends",
  description:
    "Tier list des champions League of Legends mise à jour quotidiennement. Winrate, pickrate et classement des meilleurs personnages LoL par tier pour grimper en ranked.",
  keywords: [
    "lol tier list",
    "league of legends tier list",
    "tier list league of legends",
    "champions league of legends",
    "league of legends champions",
    "champion league of legends",
    "league of legends personnage",
    "meilleurs champions lol",
    "best lol champions",
    "lol champion rankings",
    "lol meta",
  ],
  openGraph: {
    ...baseOpenGraph,
    title: "Tier List Champions LoL - Meilleurs Champions League of Legends",
    description:
      "Tier list des champions League of Legends mise à jour quotidiennement. Winrate, pickrate et classement des meilleurs personnages LoL.",
    type: "website",
  },
  alternates: {
    canonical: buildSiteUrl("/tier-list/champions"),
  },
};

const tierListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "League of Legends Champion Tier List",
  description:
    "Ranking of League of Legends champions based on win rate, pick rate, and overall performance in ranked games.",
  url: buildSiteUrl("/tier-list/champions"),
  itemListOrder: "https://schema.org/ItemListOrderDescending",
  numberOfItems: 168,
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Quel est le meilleur personnage de League of Legends ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les meilleurs personnages LoL varient selon le patch et le rôle. Consultez notre tier list pour découvrir les champions avec les meilleurs winrates, mise à jour quotidiennement.",
      },
    },
    {
      "@type": "Question",
      name: "Comment fonctionne la tier list des champions LoL ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Notre tier list est calculée à partir du winrate, du pickrate, du banrate et des données de performance de milliers de parties ranked, mise à jour chaque jour.",
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

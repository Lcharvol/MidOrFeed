import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { buildSiteUrl } from "@/constants/site";
import { SITE_NAME, baseOpenGraph, websiteJsonLd } from "@/constants/seo";

export const metadata: Metadata = {
  title: "Simulateur Draft LoL - Draft Simulator League of Legends",
  description:
    "Practice the League of Legends ranked draft phase against an AI opponent. Ban and pick champions, analyze lane matchups, and get your team composition win probability scored in real time.",
  keywords: [
    "lol draft simulator",
    "league of legends draft",
    "champion select practice",
    "lol team composition",
    "draft practice tool",
    "lol draft tool",
    "lol ban pick simulator",
    "league draft practice",
    "lol comp builder",
    "champion select simulator",
  ],
  openGraph: {
    ...baseOpenGraph,
    title: "LoL Draft Simulator - Practice Champion Select & Team Comps",
    description:
      "Practice the League of Legends ranked draft against an AI. Ban & pick champions, analyze matchups, and get your team comp scored.",
    type: "website",
    url: buildSiteUrl("/draft"),
  },
  twitter: {
    card: "summary_large_image",
    title: "LoL Draft Simulator - Mid or Feed",
    description:
      "Practice ranked champion select against AI. Build your comp and get it scored.",
  },
  alternates: {
    canonical: buildSiteUrl("/draft"),
  },
};

const draftToolSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "LoL Draft Simulator",
  url: buildSiteUrl("/draft"),
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  description:
    "Practice the League of Legends ranked draft phase against an AI opponent. Ban and pick champions, analyze lane matchups, and get your team composition scored.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  isPartOf: websiteJsonLd,
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does the LoL draft simulator work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You play as the blue side and ban/pick champions in the standard ranked draft order. An AI opponent handles the red side. After all picks are complete, your team composition is scored based on lane matchups and overall win probability.",
      },
    },
    {
      "@type": "Question",
      name: "Is the draft simulator free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, the draft simulator is completely free to use. You can optionally log in to save your draft history and track your improvement over time.",
      },
    },
    {
      "@type": "Question",
      name: "How is the team composition score calculated?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The score is calculated using champion win rates, counter-pick matchup data from thousands of ranked games, and lane-by-lane analysis to estimate your team's overall win probability.",
      },
    },
  ],
};

export default function DraftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={draftToolSchema} />
      <JsonLd data={faqSchema} />
      {children}
    </>
  );
}

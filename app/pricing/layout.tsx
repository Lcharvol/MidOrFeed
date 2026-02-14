import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { buildSiteUrl } from "@/constants/site";
import { SITE_NAME } from "@/constants/seo";

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Découvrez les plans gratuit et premium de Mid or Feed. Analyses IA illimitées, coaching personnalisé et statistiques avancées.",
  alternates: {
    canonical: buildSiteUrl("/pricing"),
  },
};

const pricingPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `${SITE_NAME} Pricing`,
  description:
    `Free and premium plans for ${SITE_NAME}, a League of Legends companion tool.`,
  url: buildSiteUrl("/pricing"),
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: `${SITE_NAME} Premium`,
  description:
    "Unlimited AI analysis, personalised coaching and advanced statistics for League of Legends.",
  brand: { "@type": "Brand", name: SITE_NAME },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    availability: "https://schema.org/OutOfStock",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={pricingPageSchema} />
      <JsonLd data={productSchema} />
      {children}
    </>
  );
}

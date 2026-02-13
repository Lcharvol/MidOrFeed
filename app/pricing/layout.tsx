import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Découvrez les plans gratuit et premium de Mid or Feed. Analyses IA illimitées, coaching personnalisé et statistiques avancées.",
  alternates: {
    canonical: "https://midorfeed.gg/pricing",
  },
};

const pricingPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Mid or Feed Pricing",
  description:
    "Free and premium plans for Mid or Feed, a League of Legends companion tool.",
  url: "https://midorfeed.gg/pricing",
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Mid or Feed Premium",
  description:
    "Unlimited AI analysis, personalised coaching and advanced statistics for League of Legends.",
  brand: { "@type": "Brand", name: "Mid or Feed" },
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

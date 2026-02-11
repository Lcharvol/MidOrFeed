import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs",
  description:
    "Découvrez les plans gratuit et premium de Mid or Feed. Analyses IA illimitées, coaching personnalisé et statistiques avancées.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

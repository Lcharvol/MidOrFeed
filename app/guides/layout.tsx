import { Metadata } from "next";
import { buildSiteUrl } from "@/constants/site";
import { JsonLd } from "@/components/JsonLd";

const SITE_NAME = "Mid or Feed";

export const metadata: Metadata = {
  title: "Guides Champions - Builds, Runes et Conseils",
  description:
    "Découvrez les meilleurs guides champions créés par la communauté. Builds, runes, conseils de jeu et matchups pour tous les champions de League of Legends.",
  openGraph: {
    title: "Guides Champions - Mid or Feed",
    description:
      "Découvrez les meilleurs guides champions créés par la communauté. Builds, runes et conseils de jeu.",
    url: buildSiteUrl("/guides"),
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Guides Champions - Mid or Feed",
    description:
      "Découvrez les meilleurs guides champions créés par la communauté.",
  },
  alternates: {
    canonical: buildSiteUrl("/guides"),
  },
};

export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Guides Champions",
    description:
      "Collection de guides champions pour League of Legends créés par la communauté Mid or Feed.",
    url: buildSiteUrl("/guides"),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: buildSiteUrl("/"),
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Accueil",
          item: buildSiteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Guides Champions",
          item: buildSiteUrl("/guides"),
        },
      ],
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
    </>
  );
}

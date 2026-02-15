import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConditionalHeader } from "@/components/ConditionalHeader";
import { NotificationProvider } from "@/components/NotificationProvider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/lib/i18n-context";
import { GameVersionProvider } from "@/components/GameVersionProvider";
import { ServerStatusBanner } from "@/components/ServerStatusBanner";
import { ConstructionBanner } from "@/components/ConstructionBanner";
import { JsonLd } from "@/components/JsonLd";
import { Footer } from "@/components/Footer";
import { buildSiteUrl } from "@/constants/site";
import { SITE_NAME, TWITTER_HANDLE, DEFAULT_LOCALE, LOGO_URL_PATH } from "@/constants/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mid or Feed - Champions LoL, Tier List & Stats League of Legends",
    template: "%s | Mid or Feed",
  },
  description:
    "Tier list des champions League of Legends, statistiques, counter picks et compositions d'équipe. Retrouvez les stats de tous les personnages LoL, les meilleurs items et le classement des joueurs.",
  keywords: [
    "lol",
    "league of legend",
    "league of legends",
    "champions league of legends",
    "league of legends champions",
    "league of legends personnage",
    "tier list league of legends",
    "league of legends tier list",
    "league of legends stats",
    "league of legends news",
    "patch league of legends",
    "jeu league of legends",
    "lol counter",
    "counter lol",
    "league of legends counter",
    "lol counter pick",
    "counter picks lol",
    "lol stats",
    "mid or feed",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: DEFAULT_LOCALE,
    alternateLocale: "en_US",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
  },
  metadataBase: new URL(buildSiteUrl("/")),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Global JSON-LD schemas for SEO
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: "MidOrFeed",
  url: buildSiteUrl("/"),
  description: "Find the best League of Legends counter picks, analyze your performance, and get team composition suggestions with AI-powered coaching.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${buildSiteUrl("/summoners")}?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: buildSiteUrl("/"),
  logo: buildSiteUrl(LOGO_URL_PATH),
  sameAs: ["https://twitter.com/MidOrFeed"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <JsonLd data={websiteSchema} />
        <JsonLd data={organizationSchema} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium"
        >
          Aller au contenu principal
        </a>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <I18nProvider>
            <AuthProvider>
              <GameVersionProvider>
                <NotificationProvider>
                  <ConditionalHeader />
                  <ConstructionBanner />
                  <ServerStatusBanner />
                  <main id="main-content" className="relative">
                    <div className="pointer-events-none absolute inset-0 -z-10 select-none">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--color-primary),transparent_70%)]/[8]" />
                    </div>
                    <div className="relative">{children}</div>
                  </main>
                  <Footer />
                  <Toaster />
                </NotificationProvider>
              </GameVersionProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

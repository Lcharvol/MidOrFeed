import type { Metadata } from "next";
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
    default: "Mid or Feed - LoL Counter Picks & Stats",
    template: "%s | Mid or Feed",
  },
  description:
    "Trouvez les meilleurs counter picks LoL, analysez vos performances et obtenez des suggestions de compositions. Find the best League of Legends counters and improve your gameplay.",
  keywords: [
    "lol counter",
    "counter lol",
    "league of legends counter",
    "lol counter pick",
    "counter picks lol",
    "lol stats",
    "league of legends",
    "mid or feed",
  ],
  authors: [{ name: "Mid or Feed" }],
  creator: "Mid or Feed",
  publisher: "Mid or Feed",
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
    locale: "fr_FR",
    alternateLocale: "en_US",
    siteName: "Mid or Feed",
  },
  twitter: {
    card: "summary_large_image",
    site: "@MidOrFeed",
    creator: "@MidOrFeed",
  },
  metadataBase: new URL("https://midorfeed.gg"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <I18nProvider>
            <AuthProvider>
              <GameVersionProvider>
                <NotificationProvider>
                  <ConditionalHeader />
                  <ConstructionBanner />
                  <ServerStatusBanner />
                  <main className="relative px-4 sm:px-6">
                    <div className="pointer-events-none absolute inset-0 -z-10 select-none">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--color-primary),transparent_55%)]/[16] dark:bg-[radial-gradient(circle_at_top,var(--color-primary),transparent_55%)]/[20]" />
                      <div className="absolute left-1/2 top-1/4 h-[480px] w-[480px] -translate-x-1/2 bg-[radial-gradient(circle,var(--color-primary),transparent_70%)]/[10] blur-3xl" />
                      <div className="absolute inset-x-0 bottom-0 h-[320px] bg-[radial-gradient(circle_at_bottom,var(--color-primary),transparent_60%)]/[15]" />
                      <div className="absolute right-0 top-0 h-[220px] w-[220px] bg-[radial-gradient(circle,var(--color-primary),transparent_60%)]/[12] blur-2xl opacity-60" />
                    </div>
                    <div className="relative">{children}</div>
                  </main>
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

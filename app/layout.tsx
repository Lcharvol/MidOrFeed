import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConditionalHeader } from "@/components/ConditionalHeader";
import { NotificationProvider } from "@/components/NotificationProvider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/lib/i18n-context";
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
  title: "MidOrFeed",
  description:
    "Analysez vos performances League of Legends et obtenez des suggestions de compositions IA",
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
              <NotificationProvider>
                <ConditionalHeader />
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
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

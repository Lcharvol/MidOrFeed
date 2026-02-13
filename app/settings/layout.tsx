import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paramètres",
  description: "Configurez vos préférences Mid or Feed : langue, thème, notifications et cache.",
  robots: { index: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

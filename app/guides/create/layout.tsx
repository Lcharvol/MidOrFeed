import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un Guide",
  description:
    "Créez et partagez votre guide de champion League of Legends. Build, runes, sorts d'invocateur et conseils de gameplay.",
};

export default function GuideCreateLayout({ children }: { children: React.ReactNode }) {
  return children;
}

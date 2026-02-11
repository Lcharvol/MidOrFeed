import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Télécharger MidOrFeed Overlay",
  description:
    "Téléchargez l'application desktop MidOrFeed Overlay pour Windows et macOS. Suggestions de picks en temps réel pendant le Champion Select.",
  keywords: ["midorfeed overlay", "lol overlay", "champion select helper", "lol desktop app"],
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return children;
}

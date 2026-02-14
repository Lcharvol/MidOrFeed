import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Draft Simulator",
  description:
    "Practice the LoL ranked champion select draft phase against an AI opponent. Ban and pick champions, then get your team composition scored.",
  keywords: [
    "lol draft simulator",
    "league of legends draft",
    "champion select practice",
    "lol team composition",
    "draft practice tool",
  ],
  openGraph: {
    title: "LoL Draft Simulator",
    description:
      "Practice the ranked champion select draft phase against an AI opponent.",
  },
};

export default function DraftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analyse IA",
  description:
    "Analyse de match par intelligence artificielle. Score de performance, forces, faiblesses et conseils personnalisés pour progresser.",
};

export default function AIAnalysisLayout({ children }: { children: React.ReactNode }) {
  return children;
}

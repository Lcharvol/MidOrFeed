import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mon Profil",
  description: "Gérez votre profil Mid or Feed, votre compte Riot lié et vos préférences.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}

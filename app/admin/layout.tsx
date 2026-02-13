import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administration",
  description: "Panneau d'administration Mid or Feed.",
  robots: { index: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}

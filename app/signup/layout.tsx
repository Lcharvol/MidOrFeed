import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inscription",
  description:
    "Créez votre compte Mid or Feed pour suivre vos performances, sauvegarder vos favoris et accéder aux analyses IA.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}

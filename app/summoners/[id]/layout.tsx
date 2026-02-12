import type { Metadata } from "next";
import { ShardedLeagueAccounts } from "@/lib/prisma-sharded-accounts";
import { buildSiteUrl } from "@/constants/site";
import SummonerProfileLayout from "./SummonerProfileLayout";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: puuid } = await params;

  const account = await ShardedLeagueAccounts.findUniqueByPuuidGlobal(puuid).catch(() => null);

  if (!account?.riotGameName) {
    return {
      title: "Profil Invocateur",
      description:
        "Consultez les statistiques, l'historique de matchs et les performances d'un joueur League of Legends.",
    };
  }

  const name = `${account.riotGameName}#${account.riotTagLine}`;
  const description = `Statistiques de ${name} sur League of Legends : historique de matchs, champions joués, classement et performances détaillées.`;
  const canonicalUrl = buildSiteUrl(`/summoners/${puuid}/overview`);

  return {
    title: `${account.riotGameName} - Profil LoL`,
    description,
    openGraph: {
      title: `${name} - Statistiques LoL`,
      description,
      url: canonicalUrl,
      siteName: "Mid or Feed",
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${name} - Statistiques LoL`,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function Layout({ children }: LayoutProps) {
  return <SummonerProfileLayout>{children}</SummonerProfileLayout>;
}

'use client';

import Link from 'next/link';

type ChampionResourcesSectionProps = {
  championId: string;
  championName: string;
};

export const ChampionResourcesSection = ({
  championId,
  championName,
}: ChampionResourcesSectionProps) => (
  <section
    aria-label="Ressources supplémentaires"
    className="rounded-xl border border-border/50 bg-muted/20 p-6"
  >
    <h2 className="text-lg font-semibold text-foreground">Ressources Mid or Feed</h2>
    <p className="mt-2 text-sm text-muted-foreground">
      Besoin d’aller plus loin ? Explore les counter picks, les compositions populaires
      et l’analyse IA associées à {championName} pour préparer tes drafts.
    </p>
    <div className="mt-4 flex flex-wrap gap-3 text-sm text-primary">
      <Link href={`/counter-picks/${encodeURIComponent(championId)}`} className="underline">
        Counter picks {championName}
      </Link>
      <Link href="/compositions/popular" className="underline">
        Compositions recommandées
      </Link>
    </div>
  </section>
);

import { cn } from "@/lib/utils";

type CounterPicksSeoContentProps = {
  championName?: string | null;
  topCounters?: string[];
  className?: string;
};

/**
 * SEO-friendly content component for counter-picks pages.
 * Provides textual content and FAQ for better Google indexing.
 */
export function CounterPicksSeoContent({
  championName,
  topCounters = [],
  className,
}: CounterPicksSeoContentProps) {
  if (championName) {
    return (
      <section
        className={cn(
          "mt-12 space-y-6 text-muted-foreground text-sm leading-relaxed",
          className
        )}
      >
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Comment contrer {championName} sur League of Legends
          </h2>
          <p>
            Trouver le bon counter pick contre {championName} peut faire la
            différence entre une victoire et une défaite en ranked. Notre analyse,
            basée sur des milliers de matchs de haut niveau, vous montre les
            champions les plus efficaces pour contrer {championName}.
          </p>
          <p>
            Finding the right counter pick against {championName} can make the
            difference between winning and losing in ranked. Our analysis, based
            on thousands of high-level matches, shows you the most effective
            champions to counter {championName}.
          </p>
        </div>

        {topCounters.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              Meilleurs counters de {championName}
            </h3>
            <p>
              Les champions avec le meilleur winrate contre {championName} sont :{" "}
              <strong>{topCounters.join(", ")}</strong>. Ces picks offrent un
              avantage significatif en lane et en teamfight.
            </p>
          </div>
        )}

        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-medium text-foreground">
            Questions fréquentes - FAQ
          </h3>

          <details className="group">
            <summary className="cursor-pointer font-medium text-foreground hover:text-primary">
              Quel est le meilleur counter de {championName} ?
            </summary>
            <p className="mt-2 pl-4">
              Le meilleur counter de {championName} dépend de votre rôle et de
              votre style de jeu. Consultez notre analyse ci-dessus pour voir les
              champions avec le meilleur winrate contre {championName} basé sur
              les données actuelles de la saison.
            </p>
          </details>

          <details className="group">
            <summary className="cursor-pointer font-medium text-foreground hover:text-primary">
              Comment jouer contre {championName} en lane ?
            </summary>
            <p className="mt-2 pl-4">
              Pour bien jouer contre {championName}, choisissez un champion avec
              un kit qui exploite ses faiblesses. Étudiez les cooldowns de ses
              capacités principales et punissez-le quand elles sont en
              rechargement.
            </p>
          </details>

          <details className="group">
            <summary className="cursor-pointer font-medium text-foreground hover:text-primary">
              What is the best counter for {championName}?
            </summary>
            <p className="mt-2 pl-4">
              The best counter for {championName} depends on your role and
              playstyle. Check our analysis above to see the champions with the
              highest winrate against {championName} based on current season
              data.
            </p>
          </details>
        </div>
      </section>
    );
  }

  // Generic content for the main counter-picks page
  return (
    <section
      className={cn(
        "mt-12 space-y-6 text-muted-foreground text-sm leading-relaxed",
        className
      )}
    >
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Counter picks League of Legends - Guide complet
        </h2>
        <p>
          Maîtrisez l&apos;art du counter picking sur LoL. Notre outil analyse
          des milliers de matchs pour vous recommander les meilleurs picks contre
          n&apos;importe quel champion de League of Legends.
        </p>
        <p>
          Master the art of counter picking in LoL. Our tool analyzes thousands
          of matches to recommend the best picks against any League of Legends
          champion.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">
          Qu&apos;est-ce qu&apos;un counter pick ?
        </h3>
        <p>
          Un counter pick est un champion qui possède un avantage naturel contre
          un autre grâce à son kit, ses stats ou son style de jeu. Choisir le bon
          counter peut augmenter significativement vos chances de gagner votre
          lane et la partie.
        </p>
        <p>
          A counter pick is a champion that has a natural advantage against
          another due to their kit, stats, or playstyle. Choosing the right
          counter can significantly increase your chances of winning your lane
          and the game.
        </p>
      </div>

      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-medium text-foreground">
          Questions fréquentes - FAQ
        </h3>

        <details className="group">
          <summary className="cursor-pointer font-medium text-foreground hover:text-primary">
            Comment trouver le meilleur counter pick ?
          </summary>
          <p className="mt-2 pl-4">
            Utilisez notre outil ci-dessus pour sélectionner le champion adverse.
            Nous afficherons automatiquement les meilleurs counters basés sur les
            données de winrate actuelles.
          </p>
        </details>

        <details className="group">
          <summary className="cursor-pointer font-medium text-foreground hover:text-primary">
            Les counter picks sont-ils fiables ?
          </summary>
          <p className="mt-2 pl-4">
            Nos données sont basées sur des milliers de matchs analysés. Cependant,
            le skill individuel et la composition d&apos;équipe jouent aussi un
            rôle important. Utilisez ces informations comme guide, pas comme règle
            absolue.
          </p>
        </details>

        <details className="group">
          <summary className="cursor-pointer font-medium text-foreground hover:text-primary">
            How do I find the best counter pick?
          </summary>
          <p className="mt-2 pl-4">
            Use our tool above to select the enemy champion. We will automatically
            display the best counters based on current winrate data.
          </p>
        </details>
      </div>
    </section>
  );
}

/**
 * Generate FAQ schema for structured data
 */
export function generateFaqSchema(championName?: string | null) {
  if (championName) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `Quel est le meilleur counter de ${championName} ?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `Le meilleur counter de ${championName} dépend de votre rôle et de votre style de jeu. Consultez notre analyse pour voir les champions avec le meilleur winrate contre ${championName} basé sur les données actuelles.`,
          },
        },
        {
          "@type": "Question",
          name: `Comment jouer contre ${championName} en lane ?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `Pour bien jouer contre ${championName}, choisissez un champion avec un kit qui exploite ses faiblesses. Étudiez les cooldowns de ses capacités principales et punissez-le quand elles sont en rechargement.`,
          },
        },
        {
          "@type": "Question",
          name: `What is the best counter for ${championName}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `The best counter for ${championName} depends on your role and playstyle. Check our analysis to see the champions with the highest winrate against ${championName} based on current season data.`,
          },
        },
      ],
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Comment trouver le meilleur counter pick sur LoL ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Utilisez notre outil pour sélectionner le champion adverse. Nous afficherons automatiquement les meilleurs counters basés sur les données de winrate actuelles.",
        },
      },
      {
        "@type": "Question",
        name: "Les counter picks sont-ils fiables ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nos données sont basées sur des milliers de matchs analysés. Le skill individuel et la composition d'équipe jouent aussi un rôle important.",
        },
      },
      {
        "@type": "Question",
        name: "How do I find the best LoL counter pick?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use our tool to select the enemy champion. We will automatically display the best counters based on current winrate data.",
        },
      },
    ],
  };
}

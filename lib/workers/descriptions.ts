/**
 * Worker descriptions for the admin panel
 * Separated from index.ts to avoid pulling pg-boss/pg into client bundles.
 */
export const WORKER_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  "champion-stats": {
    name: "Champion Stats",
    description: "Calcule les statistiques (winrate, KDA, counters) pour chaque champion",
  },
  "composition-gen": {
    name: "Compositions",
    description: "Génère des suggestions de pick basées sur l'analyse des matchs",
  },
  "data-crawl": {
    name: "Data Crawl",
    description: "Collecte les matchs des joueurs découverts pour enrichir la base de données",
  },
  "account-sync": {
    name: "Account Sync",
    description: "Synchronise les comptes joueurs depuis l'API Riot",
  },
  "leaderboard-sync": {
    name: "Leaderboard Sync",
    description: "Synchronise les classements Challenger/GM/Master depuis l'API Riot",
  },
  "ddragon-sync": {
    name: "DDragon Sync",
    description: "Met à jour les champions, items et versions depuis DDragon CDN",
  },
  "meta-analysis": {
    name: "Meta Analysis",
    description: "Analyse la méta actuelle: top picks par rôle, tendances",
  },
  "synergy-analysis": {
    name: "Synergy Analysis",
    description: "Calcule les synergies entre champions (duos gagnants)",
  },
  "item-builds": {
    name: "Item Builds",
    description: "Analyse les builds d'items les plus efficaces par champion",
  },
  "analyze-items": {
    name: "Item Stats",
    description: "Calcule les statistiques globales des items (winrate, pickrate, score) pour la tier list",
  },
  "data-cleanup": {
    name: "Data Cleanup",
    description: "Nettoie les données anciennes pour optimiser la base de données",
  },
  "account-refresh": {
    name: "Account Refresh",
    description: "Rafraîchit les informations des comptes liés (niveau, icône, nom)",
  },
  "daily-reset": {
    name: "Daily Reset",
    description: "Reset les quotas journaliers et effectue la maintenance quotidienne",
  },
};

# MidOrFeed

Plateforme d'analyse de performances League of Legends avec suggestions de compositions IA, statistiques avancées et coaching personnalisé.

## 🚀 Technologies

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS, Recharts
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL avec sharding par région
- **Queue**: BullMQ + Redis (jobs asynchrones)
- **IA**: Anthropic Claude (analyses, raisonnements)
- **Authentification**: bcryptjs, JWT (HTTP-only cookies)
- **Validation**: Zod, react-hook-form
- **Internationalisation**: next-intl (FR/EN)
- **Monitoring**: Métriques personnalisées, health checks, alerting, notifications temps réel
- **Cache**: Redis + in-memory cache avec TTL
- **Sécurité**: Rate limiting, timeouts, headers de sécurité, encryption

## 📦 Installation

```bash
# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env et configurer :
# - DATABASE_URL (PostgreSQL ou SQLite)
# - RIOT_API_KEY (clé API Riot Games)
# - GOOGLE_CLIENT_ID (pour l'authentification Google, optionnel)
# - ENCRYPTION_KEY (pour le chiffrement des données sensibles, optionnel)
# - SLACK_WEBHOOK_URL (pour les alertes Slack, optionnel - voir docs/SLACK_SETUP.md)
# - JWT_SECRET (pour l'authentification JWT, optionnel en dev, requis en prod)

# Générer le client Prisma
pnpm run prisma:generate

# Créer la base de données et appliquer les migrations
pnpm run prisma:migrate

# Synchroniser les données initiales
pnpm run sync:champions
pnpm run sync:items

# Lancer le serveur de développement
pnpm dev
```

L'application sera accessible sur <http://localhost:3000>

## 🗄️ Base de données

### Architecture

- **PostgreSQL** en production avec sharding des comptes LoL par région
- **SQLite** en développement
- **Prisma ORM** pour la gestion des modèles et migrations

### Sharding des comptes League of Legends

Les comptes League of Legends sont shardés par région dans des tables séparées pour optimiser les performances :

- `league_accounts_euw1` (Europe West)
- `league_accounts_na1` (North America)
- `league_accounts_kr` (Korea)
- ... et autres régions

**Migration** :

```bash
# Migrer vers le sharding (production)
pnpm sharding:migrate

# Vérifier le sharding
pnpm sharding:verify

# Supprimer la table de backup (après vérification)
pnpm sharding:drop-backup
```

### Visualiser la base de données

```bash
pnpm run prisma:studio
```

Ouvre l'interface Prisma Studio sur <http://localhost:5555>

### Commandes Prisma utiles

```bash
# Générer le client Prisma
pnpm run prisma:generate

# Créer une nouvelle migration
pnpm run prisma:migrate

# Ouvrir Prisma Studio
pnpm run prisma:studio
```

## 🔐 Authentification

L'application dispose d'un système d'authentification complet avec sécurité renforcée :

### Fonctionnalités

- **Inscription** (`/signup`) : Création de compte avec validation stricte
- **Connexion** (`/login`) : Authentification sécurisée avec rate limiting
- **JWT** : Authentification basée sur des tokens JWT (remplace les headers `x-user-id`)
- **Validation** : Utilisation de Zod pour la validation des formulaires avec messages traduits
- **Sécurité** : Mots de passe hashés avec bcryptjs
- **Interface** : Formulaires avec react-hook-form et shadcn/ui
- **Session** : Gestion de session avec contexte React et localStorage
- **Profil** : Gestion du profil utilisateur et liaison avec compte Riot
- **OAuth Google** : Authentification optionnelle via Google (si configuré)

### Sécurité

- **Rate Limiting** : Protection contre les attaques par force brute
- **Request Timeouts** : Protection contre les requêtes longues
- **Security Headers** : Headers HTTP de sécurité (HSTS, CSP, X-Frame-Options, etc.)
- **SQL Sanitization** : Protection contre les injections SQL
- **Data Encryption** : Chiffrement des données sensibles au repos

## 🔔 Alerting et Monitoring

### Slack Integration

L'application peut envoyer des alertes automatiques vers Slack :

1. **Créer un webhook Slack** (voir `docs/SLACK_SETUP.md` pour le guide complet)
2. **Configurer la variable d'environnement** :
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXXXX/YYYYY/ZZZZZ
   ```
3. **Tester l'intégration** :
   ```bash
   pnpm test:slack
   ```

Les alertes sont automatiquement envoyées lors d'erreurs critiques, problèmes de synchronisation, ou alertes de monitoring.

### Monitoring

- **Health Checks** : `/api/health` pour vérifier l'état de l'application
- **Metrics** : `/api/metrics` (admin) pour les métriques de performance
- **Status** : `/api/status` (admin) pour un état détaillé de l'application
- **Alerts** : `/api/alerts` (admin) pour consulter les alertes récentes

## 🎮 Champions de League of Legends

La base de données contient tous les champions de League of Legends synchronisés depuis l'API Data Dragon de Riot Games.

### Fonctionnalités

- **Synchronisation automatique** : Script pour récupérer les derniers champions
- **171+ champions** : Toutes les données sont à jour
- **Statistiques complètes** : HP, mana, attaque, défense, magie, difficulté, etc.
- **API REST** : Endpoints paginés pour consulter et synchroniser les champions
- **Pages dédiées** : Page détaillée pour chaque champion avec :
  - Statistiques complètes
  - Abilités et ordre des compétences
  - Runes recommandées
  - Builds optimaux
  - Counter picks
  - **Leadership** : Classement des meilleurs joueurs par champion
  - Conseils communautaires avec système de vote

### Synchronisation

```bash
# Synchroniser les champions depuis l'API Riot
pnpm run sync:champions

# Synchroniser les items depuis l'API Riot
pnpm run sync:items
```

## 🎯 Fonctionnalités principales

### 1. Tier List des Champions

- Classement des champions par win rate, KDA, score personnalisé
- Filtres par rôle, tier, queue type
- Tri dynamique par colonne
- Statistiques de fiabilité (nombre de matchs minimum)

### 2. Profils de Joueurs

- Vue d'ensemble complète des statistiques
- Historique des matchs récents
- Performance par champion
- Performance par rôle avec graphiques radar
- Classements et progression
- Challenges et accomplissements

### 3. Compositions d'Équipe

- Création de compositions de 5 champions
- Suggestions basées sur les statistiques
- Analyse des synergies
- Compositions populaires

### 4. Counter Picks

- Suggestions de champions pour contrer un ennemi
- Analyse des matchups basée sur les données réelles
- Statistiques de win rate par matchup
- **SEO optimisé** : pages indexées pour "lol counter [champion]"
- Contenu bilingue FR/EN avec FAQ schema

### 5. Suggestions de Compositions IA

- Génération automatique de picks recommandés par rôle
- **Synergies par duo** : ADC+Support, Mid+Jungle, Top+Jungle
- **Counter matchups** : champions efficaces contre les ennemis
- **Raisonnement IA** : explications générées par Claude
- **Métriques avancées** : dégâts/min, gold/min, vision/min

### 6. Leadership par Champion

- Classement des meilleurs joueurs par champion
- Statistiques : win rate, KDA, nombre de parties
- Score personnalisé basé sur performance et volume

### 7. Profil Utilisateur

- **Design moderne** avec header gradient et badges
- **Affichage du rang** : Solo/Duo et Flex avec emblèmes par tier
- **Abonnement** : badge Free/Premium, usage quotidien avec barre de progression
- **Paramètres** : thème, langue, changement de mot de passe
- **Onglets** : Compte, Statistiques, Paramètres

### 8. Administration

- **Panel admin** (`/admin`) avec plusieurs onglets :
  - **Discovery** : Gestion du crawl de données, synchronisation des comptes
  - **Data Sync** : Synchronisation manuelle des données
  - **Rights** : Gestion des droits utilisateurs
  - **Jobs** : Monitoring des jobs asynchrones avec notifications temps réel
  - **ML** : Gestion des pipelines d'apprentissage automatique
- Statistiques en temps réel
- Monitoring et alertes
- **Notifications admin** : alertes SSE quand les jobs se terminent

### 9. Jobs Asynchrones (BullMQ)

L'application utilise BullMQ + Redis pour les tâches en arrière-plan :

| Queue | Description |
|-------|-------------|
| `champion-stats` | Calcul des statistiques par champion |
| `compositions` | Génération des suggestions de composition IA |
| `synergy-analysis` | Analyse des synergies entre champions |
| `counter-analysis` | Analyse des counter picks |
| `leaderboard` | Mise à jour du classement |
| `match-history` | Import de l'historique des matchs |
| `player-discovery` | Découverte de nouveaux joueurs |
| `daily-reset` | Réinitialisation quotidienne des compteurs |
| `data-cleanup` | Nettoyage des données obsolètes |

Les admins reçoivent des notifications en temps réel (SSE) à la fin de chaque job.

## 📁 Structure du projet

```text
mid-or-feed/
├── app/
│   ├── api/                  # Routes API
│   │   ├── admin/           # Endpoints admin (stats, pipeline, etc.)
│   │   ├── alerts/          # Gestion des alertes
│   │   ├── auth/            # Authentification
│   │   ├── champions/       # API champions (list, stats, runes, builds, leadership)
│   │   ├── challenges/      # Challenges et accomplissements
│   │   ├── compositions/   # Compositions d'équipe
│   │   ├── counter-picks/   # Counter picks
│   │   ├── crawl/           # Système de crawl
│   │   ├── health/          # Health checks
│   │   ├── items/           # Items LoL
│   │   ├── matches/         # Matchs
│   │   ├── metrics/         # Métriques de performance
│   │   ├── riot/            # API Riot Games
│   │   ├── search/          # Recherche
│   │   ├── status/          # Statut détaillé de l'application
│   │   ├── summoners/       # Profils de joueurs
│   │   └── user/            # Gestion utilisateur
│   ├── admin/               # Interface d'administration
│   ├── ai-analysis/         # Analyses IA
│   ├── champions/           # Pages champions
│   ├── compositions/        # Pages compositions
│   ├── counter-picks/       # Pages counter picks
│   ├── profile/             # Profil utilisateur
│   ├── summoners/           # Pages joueurs
│   ├── tier-list/           # Tier list
│   └── ...
├── components/
│   ├── ui/                  # Composants shadcn/ui
│   ├── ChampionIcon.tsx
│   ├── Header.tsx
│   ├── RiotAccountSection.tsx
│   └── ...
├── lib/
│   ├── hooks/               # Hooks React personnalisés
│   ├── api/                 # Clés API et schémas de validation
│   ├── ai/                  # Modules IA (Claude)
│   │   ├── match-analysis.ts       # Analyse de matchs
│   │   └── composition-analysis.ts # Raisonnement compositions
│   ├── workers/             # Workers BullMQ
│   │   ├── champion-stats.worker.ts
│   │   ├── composition.worker.ts
│   │   ├── synergy-analysis.worker.ts
│   │   └── ...
│   ├── queues/              # Configuration des queues
│   ├── alerting.ts          # Système d'alertes
│   ├── api-monitoring.ts    # Monitoring automatique des API
│   ├── cache.ts             # Cache en mémoire avec TTL
│   ├── encryption.ts        # Chiffrement des données
│   ├── env.ts               # Validation des variables d'environnement
│   ├── logger.ts            # Logging structuré
│   ├── metrics.ts           # Métriques de performance
│   ├── notification-hub.ts  # Hub de notifications SSE
│   ├── pagination.ts        # Utilitaires de pagination
│   ├── prisma.ts            # Client Prisma configuré
│   ├── prisma-sharded-accounts.ts  # Gestion du sharding
│   ├── rate-limit.ts        # Rate limiting
│   ├── redis.ts             # Client Redis (BullMQ)
│   ├── riot-api.ts          # Client API Riot avec retry et cache
│   ├── security-headers.ts  # Headers de sécurité
│   ├── sharding-config.ts   # Configuration du sharding
│   ├── sql-sanitization.ts  # Protection SQL injection
│   └── timeout.ts           # Timeouts pour requêtes
├── constants/
│   ├── riot-regions.ts      # Régions Riot centralisées
│   └── ...
├── scripts/
│   ├── migrate-to-sharded-accounts.ts  # Migration vers sharding
│   ├── verify-sharding.ts   # Vérification du sharding
│   ├── sync-champions.ts    # Synchronisation champions
│   ├── sync-items.ts        # Synchronisation items
│   ├── crawl-seed.ts        # Découverte de joueurs
│   └── ...
├── messages/
│   ├── fr.json              # Traductions françaises
│   └── en.json              # Traductions anglaises
├── prisma/
│   ├── schema.prisma        # Schéma Prisma
│   └── migrations/          # Migrations
├── types/
│   ├── api.ts               # Types API stricts
│   ├── champions.ts
│   ├── tier-list.ts
│   └── ...
└── __tests__/               # Tests unitaires
    ├── api/
    └── lib/
```

## 🎨 Interface

L'application utilise un thème inspiré de League of Legends avec :

- **Mode sombre/clair** : Support des deux modes avec système de thème
- **Couleurs** : Palette violette et or inspirée de LoL
- **Composants UI** : shadcn/ui pour une interface moderne et accessible
- **Internationalisation** : Support FR/EN avec next-intl
- **Responsive** : Design adaptatif mobile/tablette/desktop

## 🛠️ Scripts disponibles

### Développement

```bash
pnpm dev              # Lancer le serveur de développement
pnpm build            # Créer une build de production
pnpm start            # Lancer le serveur de production
pnpm lint             # Lancer ESLint
```

### Base de données

```bash
pnpm run prisma:studio        # Ouvrir Prisma Studio
pnpm run prisma:generate      # Régénérer le client Prisma
pnpm run prisma:migrate       # Créer/appliquer les migrations
```

### Synchronisation des données

```bash
pnpm run sync:champions       # Synchroniser les champions depuis l'API Riot
pnpm run sync:items           # Synchroniser les items depuis l'API Riot
```

### Sharding

```bash
pnpm sharding:migrate         # Migrer vers le sharding des comptes
pnpm sharding:verify          # Vérifier le sharding
pnpm sharding:test            # Tester les endpoints shardés
pnpm sharding:drop-backup     # Supprimer la table de backup
```

### Système de Crawl

```bash
pnpm crawl:seed [region] [count]  # Découvrir de nouveaux joueurs
pnpm crawl:process                # Traiter les joueurs en attente
pnpm crawl:status                 # Voir les statistiques
pnpm crawl:sync-accounts          # Synchroniser les comptes depuis les matchs
```

### Administration

```bash
pnpm make-admin [email]  # Donner les droits admin à un utilisateur
```

### Machine Learning

```bash
pnpm ml:export                   # Exporter les matchs pour l'entraînement
pnpm ml:train                    # Entraîner le modèle de prédiction
pnpm ml:predict                  # Utiliser le modèle pour prédire
pnpm ml:export:compositions      # Exporter les compositions
pnpm ml:train:compositions       # Entraîner le modèle de compositions
```

## 🔒 Sécurité

L'application intègre de nombreuses mesures de sécurité :

### Authentification & Autorisation

- **Rate Limiting** : Protection contre les attaques par force brute
  - Auth endpoints : 5 requêtes/minute
  - API publiques : 60 requêtes/minute
  - Admin : 10 requêtes/minute
- **Request Validation** : Validation stricte des payloads (taille, format)
- **Password Hashing** : bcryptjs avec salt rounds
- **Session Management** : Gestion sécurisée des sessions

### Protection des données

- **SQL Sanitization** : Protection contre les injections SQL
- **Data Encryption** : Chiffrement AES-256-GCM pour données sensibles
- **Request Timeouts** : Protection contre les requêtes longues
  - API : 10 secondes
  - Database : 30 secondes
- **Security Headers** : Headers HTTP de sécurité complets
  - HSTS (en production)
  - CSP (Content Security Policy)
  - X-Frame-Options, X-Content-Type-Options, etc.

### Monitoring & Alerting

- **Health Checks** : `/api/health` pour vérifier l'état de l'application
- **Status Endpoint** : `/api/status` (admin) pour un status détaillé
- **Metrics** : `/api/metrics` (admin) pour les métriques de performance
- **Alerts** : `/api/alerts` (admin) pour les alertes récentes
- **Structured Logging** : Logs JSON en production, logs lisible en dev

## ⚡ Performance

### Frontend

- **Lazy Loading** : Composants lourds chargés à la demande
  - Sections de champions (abilities, counters, builds, etc.)
  - Onglets admin
  - Composants de graphiques (Recharts)
- **Code Splitting** : Chunks séparés par fonctionnalité
- **Images Optimisées** : Utilisation de `next/image` partout
- **Cache Client** : SWR pour le cache et revalidation automatique

### Backend

- **Pagination** : Toutes les listes sont paginées (limite max: 1000)
- **Caching** : Cache en mémoire avec TTL pour données statiques
- **Sharding** : Comptes LoL shardés par région
- **Batch Operations** : Requêtes groupées pour optimiser la DB
- **Connection Pooling** : Configuration optimisée de Prisma

### API Riot Games

- **Retry avec Backoff Exponentiel** : Retry automatique en cas d'erreur
- **Rate Limiting Intelligent** : Gestion des rate limits par routing
- **Cache des Réponses** : Cache 5 minutes pour réduire les appels API
- **Timeouts Configurables** : Protection contre les requêtes longues
- **Gestion d'Erreurs** : Gestion complète des erreurs 429, 500+, etc.

## 📊 Monitoring & Observabilité

### Métriques

- **Temps de réponse** : P50, P95, P99 par endpoint
- **Taux d'erreur** : Suivi des erreurs par endpoint
- **Utilisation DB** : Latence et nombre de requêtes
- **Métriques API Riot** : Suivi des appels externes

### Health Checks

- **`/api/health`** : Status général (healthy/degraded/unhealthy)
  - Vérification de la connexion DB
  - Latence de réponse
- **`/api/status`** : Status détaillé (admin uniquement)
  - Uptime, métriques, alertes récentes
  - Statistiques par endpoint
  - État de l'environnement

### Alerting

- **Niveaux d'alerte** : LOW, MEDIUM, HIGH, CRITICAL
- **Alertes automatiques** :
  - Rate limit API Riot atteint
  - Erreurs critiques d'API
  - Problèmes de base de données
- **Endpoint** : `/api/alerts` pour consulter les alertes

## 🌐 Internationalisation

L'application supporte plusieurs langues via `next-intl` :

- **Français** (par défaut)
- **Anglais**

Les traductions sont dans `messages/fr.json` et `messages/en.json`.

## 🕷️ Système de Crawl de Données

MidOrFeed intègre un système de crawl automatique pour collecter des données de joueurs et de matchs depuis l'API Riot Games.

### Commandes rapides

```bash
# Découvrir de nouveaux joueurs
pnpm crawl:seed euw1 50

# Crawler les joueurs en attente
pnpm crawl:process

# Voir les statistiques
pnpm crawl:status

# Synchroniser les comptes depuis les matchs
pnpm crawl:sync-accounts
```

### Documentation complète

Consultez [CRAWL_SYSTEM.md](./CRAWL_SYSTEM.md) pour la documentation détaillée du système de crawl.

## 🧪 Tests

L'application inclut des tests unitaires pour les utilitaires critiques :

```bash
# Exécuter les tests (si configuré)
pnpm test

# Tests disponibles :
# - lib/pagination.test.ts
# - lib/rate-limit.test.ts
# - api/health.test.ts
```

Voir [**tests**/README.md](./__tests__/README.md) pour plus d'informations.

## 🚢 Déploiement

### Production

L'application est configurée pour le déploiement sur Fly.io avec :

- **Dockerfile** : Build optimisé avec multi-stage
- **fly.toml** : Configuration Fly.io
- **Output Standalone** : Build Next.js standalone pour réduire la taille

### Variables d'environnement

```bash
# Base de données
DATABASE_URL=postgresql://...

# API Riot Games
RIOT_API_KEY=your_riot_api_key

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optionnel
GOOGLE_CLIENT_ID=your_google_client_id
ENCRYPTION_KEY=your_encryption_key

# Timeouts (optionnel)
DB_TIMEOUT_MS=30000
API_TIMEOUT_MS=10000
```

## 📝 Prochaines étapes

Voir [docs/TODOS.md](./docs/TODOS.md) pour la liste complète des améliorations prévues.

### Fonctionnalités principales

- [x] Implémenter le système d'authentification
- [x] Ajouter les champions depuis l'API Riot
- [x] Intégrer les items depuis l'API Riot
- [x] Implémenter le système de crawl
- [x] Ajouter le sharding des comptes LoL
- [x] Implémenter les optimisations de performance
- [x] Ajouter les headers de sécurité
- [x] Implémenter le monitoring et l'alerting
- [x] Optimiser l'API Riot avec retry et cache
- [x] Ajouter les jobs asynchrones (BullMQ + Redis)
- [x] Implémenter les notifications admin temps réel
- [x] Améliorer le SEO pour "lol counter"
- [x] Ajouter le raisonnement IA aux compositions
- [x] Refonte de la page profil avec rangs et settings
- [ ] Implémenter NextAuth.js pour les sessions complètes
- [ ] Créer les fonctionnalités de compositions (sauvegarde)
- [ ] Ajouter la gestion des favoris
- [ ] Implémenter les statistiques personnalisées avancées
- [ ] Ajouter le système de notifications push

## 📄 License

MIT

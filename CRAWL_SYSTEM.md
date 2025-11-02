# 🕷️ Système de Crawl de Données League of Legends

## Vue d'ensemble

Le système de crawl permet de collecter automatiquement des données de joueurs et de matchs depuis l'API Riot Games pour alimenter votre base de données. Il est conçu pour fonctionner de manière autonome et scalable.

## Architecture

### Modèle de données

#### DiscoveredPlayer

Table qui track les joueurs découverts et leur état de crawl :

```prisma
model DiscoveredPlayer {
  id              String   @id @default(cuid())
  puuid           String   @unique // Identifiant unique du joueur
  riotGameName    String?  // Nom d'invocateur
  riotTagLine     String?  // Tag
  riotRegion      String   // Région (euw1, na1, etc.)
  
  // État de collecte
  lastCrawledAt   DateTime? // Dernière fois crawl
  crawlStatus     String   @default("pending") // pending, crawling, completed, failed
  matchesCollected Int     @default(0) // Nombre de matches collectés
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**États possibles :**

- `pending` : En attente de crawl
- `crawling` : Crawl en cours
- `completed` : Crawl terminé avec succès
- `failed` : Échec du crawl

#### LeagueOfLegendsAccount

Table qui stocke les comptes League of Legends avec leurs statistiques agrégées :

```prisma
model LeagueOfLegendsAccount {
  id              String   @id @default(cuid())
  puuid           String   @unique // PUUID unique Riot
  riotGameName    String?  // Nom d'invocateur
  riotTagLine     String?  // Tag
  riotRegion      String   // Région (euw1, na1, etc.)
  
  // Détails du compte
  riotSummonerId  String?  // Summoner ID (si disponible)
  riotAccountId   String?  // Account ID
  summonerLevel   Int?     // Niveau du summoner
  profileIconId   Int?     // ID de l'icône de profil
  revisionDate    BigInt?  // Date de dernière mise à jour Riot
  
  // Statistiques calculées
  totalMatches    Int      @default(0) // Nombre total de matchs
  totalWins       Int      @default(0) // Nombre total de victoires
  totalLosses     Int      @default(0) // Nombre total de défaites
  winRate         Float    @default(0) // Taux de victoire
  avgKDA          Float    @default(0) // KDA moyen
  mostPlayedChampion String? // Champion le plus joué
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

Cette table est automatiquement remplie depuis les participants de matchs lors de la synchronisation.

## API Endpoints

### 1. `/api/crawl/seed` - Découverte de joueurs

**Méthode :** `POST`

**Description :** Découvre de nouveaux joueurs en analysant les matchs récents existants dans votre base de données.

**Body :**

```json
{
  "region": "euw1",  // Région (obligatoire)
  "count": 50        // Nombre de joueurs à découvrir (1-100, défaut: 20)
}
```

**Réponse :**

```json
{
  "success": true,
  "message": "Seed terminé",
  "data": {
    "matchesAnalyzed": 100,
    "uniquePUUIDs": 850,
    "newPlayersAdded": 50
  }
}
```

**Comment ça marche :**

1. Récupère les 100 derniers matchs de la région spécifiée
2. Extrait tous les PUUID uniques des participants
3. Enregistre les nouveaux PUUID dans `DiscoveredPlayer` avec le statut `pending`

### 2. `/api/crawl/process` - Traitement des joueurs

**Méthode :** `POST`

**Description :** Crawl les joueurs en attente (batch de 10 à la fois pour respecter les rate limits).

**Body :** Aucun

**Réponse :**

```json
{
  "success": true,
  "message": "Crawl terminé",
  "data": {
    "playersProcessed": 10,
    "matchesCollected": 152
  }
}
```

**Comment ça marche :**

1. Récupère les 10 prochains joueurs avec `crawlStatus = "pending"`
2. Les marque comme `crawling`
3. Appelle `/api/matches/collect` pour chaque joueur (100 matchs max)
4. Met à jour le statut en `completed` ou `failed`
5. Retourne les statistiques

### 3. `/api/matches/collect` - Collecte de matchs

**Méthode :** `POST` (endpoint existant)

**Description :** Collecte les matchs d'un joueur spécifique depuis l'API Riot.

**Body :**

```json
{
  "puuid": "abc123...",
  "region": "euw1",
  "count": 100
}
```

### 4. `/api/admin/sync-accounts` - Synchronisation des comptes

**Méthode :** `POST`

**Description :** Convertit automatiquement tous les participants de matchs en comptes League of Legends avec leurs statistiques calculées.

**Réponse :**

```json
{
  "success": true,
  "message": "Synchronisation terminée",
  "data": {
    "totalPUUIDs": 850,
    "accountsCreated": 50,
    "accountsUpdated": 0
  }
}
```

**Comment ça marche :**

1. Récupère tous les PUUID uniques des participants dans la base
2. Pour chaque PUUID :
   - Calcule les statistiques (total matchs, victoires, défaites, WR, KDA moyen)
   - Identifie le champion le plus joué
   - Détermine la région depuis un match échantillon
   - Crée ou met à jour le compte dans `LeagueOfLegendsAccount`
3. Retourne les statistiques de synchronisation

## Commandes CLI

### Utilisation

```bash
# Découvrir de nouveaux joueurs
pnpm crawl:seed <region> <count>

# Crawler les joueurs en attente
pnpm crawl:process

# Synchroniser les comptes League of Legends
pnpm crawl:sync-accounts

# Voir les statistiques
pnpm crawl:status
```

### Exemples

```bash
# Découvrir 50 joueurs en Europe Ouest
pnpm crawl:seed euw1 50

# Découvrir 20 joueurs en Amérique du Nord
pnpm crawl:seed na1 20

# Crawler les joueurs en attente
pnpm crawl:process

# Synchroniser les participants en comptes
pnpm crawl:sync-accounts

# Voir le statut
pnpm crawl:status
```

### Statistiques

La commande `status` affiche :

- Total de joueurs découverts
- Total de matches collectés
- Total de comptes League of Legends synchronisés
- Répartition par statut (pending, crawling, completed, failed)

## Workflow Recommandé

### Phase 1 : Initialisation

Vous devez d'abord avoir quelques matchs dans votre base de données pour démarrer le crawl. Si vous n'en avez pas :

1. Connectez-vous à votre compte MidOrFeed
2. Liez votre compte Riot Games dans votre profil
3. Lancer une collecte manuelle de vos matchs depuis `/summoners/matches`

### Phase 2 : Découverte

```bash
# Découvrir des joueurs à partir des matchs existants
pnpm crawl:seed euw1 50
```

Cela va :

- Analyser vos 100 derniers matchs
- Extraire tous les PUUID des participants
- Enregistrer 50 nouveaux joueurs dans `DiscoveredPlayer`

### Phase 3 : Collecte (Répétitive)

```bash
# Lancer le crawl (à répéter plusieurs fois)
pnpm crawl:process
```

**Important :** Répétez cette commande plusieurs fois pour traiter toute la file. Le système traite 10 joueurs à la fois pour :

- Respecter les rate limits de l'API Riot
- Éviter les timeouts
- Permettre un traitement progressif

### Phase 4 : Synchronisation des Comptes

Une fois que vous avez collecté suffisamment de matchs, synchronisez les participants en comptes League of Legends :

**Via le panel admin (recommandé) :**

1. Allez sur `/admin`
2. Cliquez sur "Synchroniser les comptes"

**Via l'API :**

```bash
curl -X POST http://localhost:3000/api/admin/sync-accounts
```

Cela va :

- Analyser tous les participants de matchs dans la base
- Créer des comptes `LeagueOfLegendsAccount` avec leurs statistiques
- Calculer le WR, KDA moyen, et champion le plus joué
- Dédupliquer automatiquement par PUUID

### Phase 5 : Monitoring

```bash
# Vérifier la progression
pnpm crawl:status
```

### Phase 6 : Nouveau Cycle

Une fois que vous avez collecté des matchs, vous pouvez relancer un `seed` pour découvrir de nouveaux joueurs dans ces matchs :

```bash
# Nouveau cycle de découverte
pnpm crawl:seed euw1 50
pnpm crawl:process  # Répétez plusieurs fois
# Synchroniser les nouveaux comptes
# (Via /admin ou l'API)
```

## Stratégies de Crawl

### Crawl par Région

Pour collecter des données d'une région spécifique :

```bash
# Europe
pnpm crawl:seed euw1 50  # Europe Ouest
pnpm crawl:seed eun1 50  # Europe Nord & Est
pnpm crawl:seed tr1 50   # Turquie

# Amériques
pnpm crawl:seed na1 50   # Amérique du Nord
pnpm crawl:seed br1 50   # Brésil

# Asie
pnpm crawl:seed kr 50    # Corée
pnpm crawl:seed jp1 50   # Japon
```

### Crawl Progressif

Pour construire une base solide :

1. **Jour 1** : Seed initial + 10 cycles de process
2. **Jour 2** : Nouveau seed + 10 cycles de process
3. **Répéter** jusqu'à avoir assez de données

## Limitations et Rate Limits

### API Riot Games

L'API Riot impose des rate limits par clé API :

- **20 requêtes par seconde**
- **100 requêtes par 2 minutes**

Le système est conçu pour respecter ces limites :

- Batch de 10 joueurs maximum
- Délais naturels entre les appels
- Gestion des erreurs 429 (Too Many Requests)

### Recommandations

1. **Ne pas abuser** : Laissez quelques minutes entre les cycles de `crawl:process`
2. **Monitorer** : Utilisez `crawl:status` régulièrement
3. **Clé API production** : Pour un crawl massif, envisagez plusieurs clés API en rotation

## Échelle Future

### Améliorations Possibles

1. **Challenger Leaderboard Crawl**
   - Crawler directement le leaderboard Challenger
   - Obtenir les joueurs les plus actifs

2. **Crawl Automatisé**
   - Job cron quotidien
   - Crawl automatique des nouveaux joueurs

3. **Multi-clés API**
   - Rotation de plusieurs clés
   - Augmentation du débit

4. **Déduplication Améliorée**
   - Cache Redis pour éviter les doublons
   - Détection des joueurs déjà crawlé récemment

5. **Queue System**
   - Bull/Redis pour la file de traitement
   - Retry automatique des échecs

## Dépannage

### Problème : "Aucun joueur en attente"

**Cause :** Aucun joueur trouvé avec le statut `pending`

**Solution :** Lancer un `crawl:seed` d'abord

### Problème : Échecs de collecte

**Cause :**

- Clé API expirée
- Rate limits dépassés
- Joueur inexistant/inactif

**Solution :**

- Vérifier votre clé API Riot
- Attendre quelques minutes
- Les joueurs `failed` peuvent être retentés manuellement

### Problème : Pas assez de matchs pour le seed

**Cause :** Base de données vide ou peu peuplée

**Solution :**

1. Collecter vos propres matchs manuellement
2. Demander à vos utilisateurs de se connecter
3. Seed initial manuel avec des PUUID connus

## Statistiques Globales

Après plusieurs cycles de crawl, vous pouvez vérifier vos statistiques :

```sql
-- Total de joueurs découverts
SELECT COUNT(*) FROM discovered_players;

-- Par région
SELECT riotRegion, COUNT(*) 
FROM discovered_players 
GROUP BY riotRegion;

-- Par statut
SELECT crawlStatus, COUNT(*) 
FROM discovered_players 
GROUP BY crawlStatus;

-- Top 10 joueurs avec le plus de matches
SELECT puuid, matchesCollected 
FROM discovered_players 
ORDER BY matchesCollected DESC 
LIMIT 10;
```

## Support

Pour toute question ou problème avec le système de crawl :

1. Consultez les logs du terminal
2. Vérifiez Prisma Studio pour voir l'état de la base
3. Utilisez `crawl:status` pour un diagnostic rapide

## Liens Utiles

- [Documentation Riot Games API](https://developer.riotgames.com/docs/lol)
- [Endpoints de Match](https://developer.riotgames.com/apis#match-v5)
- [Rate Limits](https://developer.riotgames.com/docs/rate-limits)

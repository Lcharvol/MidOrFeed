# Améliorations du Code - Liste Complète

Cette liste répertorie toutes les améliorations possibles dans le codebase, organisées par priorité et catégorie.

## 🔴 Critique / Priorité Haute

### 1. Authentification et Sécurité

#### 1.1 Système d'authentification basé sur des sessions

**Fichiers concernés**:

- `app/api/user/save-riot-account/route.ts:22`
- `app/api/user/remove-riot-account/route.ts:7`

**Problème**: Utilisation de headers `x-user-id` au lieu d'un système d'authentification standard basé sur des sessions/JWT.

**Impact**:

- Vulnérabilité de sécurité (possibilité de manipulation du header)
- Pas de gestion de session sécurisée
- Pas de vérification d'authentification centralisée

**Solution proposée**:

- Implémenter NextAuth.js ou un système JWT
- Middleware d'authentification centralisé
- Vérification de session pour toutes les routes protégées

**Priorité**: Haute

---

#### 1.2 Messages d'erreur hardcodés dans les schémas Zod

**Fichiers concernés**:

- `app/api/auth/signup/route.ts:12-21`
- Plusieurs autres fichiers API

**Problème**: Messages d'erreur en français hardcodés dans les schémas Zod, pas de support i18n.

**Impact**:

- Pas de traduction pour les erreurs de validation
- Incohérence avec le reste de l'application (next-intl)

**Solution proposée**:

- Centraliser les messages d'erreur dans `messages/fr.json` et `messages/en.json`
- Créer une fonction helper pour récupérer les messages traduits dans les schémas Zod

**Priorité**: Moyenne-Haute

---

### 2. Base de Données et Performance

#### 2.1 Stockage de `puuid` et `riotRegion` dans le modèle User

**Fichier**: `app/api/auth/login/route.ts:96`

**Problème**: Lors de la connexion, si un utilisateur a un compte LoL associé, on doit chercher dans toutes les tables shardées pour trouver le compte.

**Impact**:

- Latence accrue lors de la connexion (recherche globale)
- Requêtes inutiles sur toutes les régions

**Solution proposée**:

- Ajouter `puuid` et `riotRegion` (optionnels) au modèle `User`
- Stocker ces informations lors de la liaison du compte LoL
- Utiliser ces informations pour un lookup direct lors de la connexion

**Priorité**: Haute

---

#### 2.2 Index manquants sur les tables fréquemment requêtées

**Fichiers concernés**:

- `prisma/schema.prisma`

**Problème**: Certaines colonnes utilisées dans des `WHERE` ou `JOIN` n'ont pas d'index, notamment :

- `MatchParticipant.championId` (recherches fréquentes)
- `MatchParticipant.participantPUuid` (recherches fréquentes)
- `Match.gameId` (recherches fréquentes)
- `Match.gameCreation` (tri par date)

**Impact**:

- Requêtes lentes sur les grandes tables
- Performance dégradée avec l'augmentation du volume de données

**Solution proposée**:

- Analyser les requêtes fréquentes avec `EXPLAIN ANALYZE`
- Ajouter des index composites pour les requêtes fréquentes
- Index partiels pour les requêtes avec conditions spécifiques

**Priorité**: Haute

---

#### 2.3 Requêtes N+1 potentielles

**Fichiers concernés**:

- `app/api/champions/[championId]/leadership/route.ts`
- `app/api/challenges/sync/route.ts:96`
- Plusieurs autres endpoints

**Problème**: Certaines routes font plusieurs requêtes en boucle au lieu d'utiliser `include` ou des requêtes groupées.

**Impact**:

- Performance dégradée avec de gros volumes
- Charge inutile sur la base de données

**Solution proposée**:

- Utiliser `include` ou `select` de Prisma pour récupérer les données liées en une seule requête
- Pour les tables shardées, faire des requêtes groupées avec `Promise.all`
- Utiliser des aggregations SQL quand possible

**Priorité**: Haute

---

## 🟠 Important / Priorité Moyenne

### 3. Logging et Observabilité

#### 3.1 Remplacement des `console.error/log/warn` par le logger structuré

**Fichiers concernés**:

- `app/api/summoners/[puuid]/ranked/route.ts:239`
- `app/api/admin/pipeline/route.ts:84,106,136,234`
- `lib/sharding-config.ts:20,41,62,83`
- `lib/prisma.ts:47,78`

**Problème**: Utilisation de `console.error/log/warn` au lieu du logger structuré (`lib/logger.ts`).

**Impact**:

- Logs non structurés en production
- Pas de niveau de log approprié
- Pas de métadonnées enrichies

**Solution proposée**:

- Remplacer tous les `console.*` par `logger.error/info/warn`
- Ajouter des métadonnées contextuelles
- Utiliser `createLogger` pour des loggers spécifiques à chaque service

**Priorité**: Moyenne

---

#### 3.2 Intégration de l'alerting avec des services externes

**Fichier**: `lib/alerting.ts:54`

**Problème**: Le système d'alerting ne fait que stocker en mémoire, pas d'envoi réel vers des services externes.

**Impact**:

- Pas de notifications en cas d'erreurs critiques
- Alertes perdues au redémarrage

**Solution proposée**:

- Intégrer avec Slack via webhook
- Option pour PagerDuty/Opsgenie
- Option pour envoi par email (pour alertes critiques uniquement)
- Configuration via variables d'environnement

**Priorité**: Moyenne

---

### 4. Cache et Performance

#### 4.1 Migration du cache en mémoire vers Redis

**Fichier**: `lib/cache.ts`

**Problème**: Cache actuellement en mémoire, perdu au redémarrage et non partagé entre instances.

**Impact**:

- Cache perdu lors des redéploiements
- Pas de partage de cache entre instances (si plusieurs instances)
- Pas de persistance

**Solution proposée**:

- Implémenter un adapter Redis pour `lib/cache.ts`
- Garder le cache en mémoire comme fallback en développement
- Configuration via variables d'environnement (`REDIS_URL`)

**Priorité**: Moyenne

---

#### 4.2 Rate limiting basé sur Redis pour la production

**Fichier**: `lib/rate-limit.ts`

**Problème**: Rate limiting actuellement en mémoire, non partagé entre instances.

**Impact**:

- Rate limiting inefficace avec plusieurs instances
- Possibilité de contourner les limites en changeant d'instance

**Solution proposée**:

- Implémenter un store Redis pour le rate limiting
- Utiliser un algorithme comme le "Token Bucket" ou "Sliding Window Log"
- Garder le store en mémoire pour le développement

**Priorité**: Moyenne

---

### 5. Fonctionnalités Manquantes

#### 5.1 Sauvegarde des compositions

**Fichier**: `app/compositions/create/page.tsx:94`

**Problème**: Les utilisateurs peuvent créer des compositions mais ne peuvent pas les sauvegarder.

**Impact**:

- Fonctionnalité principale incomplète
- Mauvaise expérience utilisateur

**Solution proposée**:

- Ajouter un modèle `Composition` dans Prisma
- Créer l'endpoint `/api/compositions` (POST, GET, DELETE)
- Page `/compositions/my` pour lister les compositions sauvegardées

**Priorité**: Haute (fonctionnalité principale)

---

#### 5.2 Stockage des runes et de l'ordre des compétences

**Fichier**: `app/api/champions/[championId]/runes/route.ts:110`

**Problème**: Les runes recommandées et l'ordre des compétences ne sont pas stockés en base.

**Impact**:

- Pas de persistance des données
- Calculs à chaque requête

**Solution proposée**:

- Ajouter un modèle `ChampionRune` ou étendre le modèle `Champion`
- Stocker les runes recommandées par rôle
- Stocker l'ordre des compétences recommandé

**Priorité**: Moyenne

---

### 6. Tests

#### 6.1 Tests d'intégration manquants

**Fichiers concernés**:

- `__tests__/` (actuellement seulement des tests unitaires)

**Problème**: Seulement des tests unitaires pour les utilitaires, pas de tests d'intégration pour les API routes.

**Impact**:

- Pas de confiance lors des changements
- Bugs non détectés avant la production

**Solution proposée**:

- Tests d'intégration pour les routes API critiques (`/api/auth/login`, `/api/user/*`, etc.)
- Tests avec une base de données de test
- Tests E2E pour les flux utilisateur principaux

**Priorité**: Moyenne-Haute

---

## 🟡 Modéré / Priorité Faible

### 7. Code Quality

#### 7.1 Centralisation des types API

**Problème**: Certains types API peuvent être dupliqués ou inconsistants.

**Impact**:

- Maintenance difficile
- Risque d'inconsistances

**Solution proposée**:

- S'assurer que tous les types API sont dans `types/api.ts`
- Créer des types génériques réutilisables
- Validation stricte des types avec Zod

**Priorité**: Faible

---

#### 7.2 Gestion d'erreurs standardisée

**Problème**: Les réponses d'erreur ne suivent pas toujours le format standardisé `ApiErrorResponse`.

**Impact**:

- Inconsistance dans les réponses d'erreur
- Difficulté pour le frontend à gérer les erreurs

**Solution proposée**:

- Créer une fonction helper `createErrorResponse` pour standardiser les erreurs
- S'assurer que tous les endpoints utilisent le format standardisé
- Codes d'erreur HTTP appropriés

**Priorité**: Faible-Moyenne

---

### 8. Performance Frontend

#### 8.1 Optimisation des bundles JavaScript

**Problème**: Certains bundles peuvent être optimisés davantage.

**Impact**:

- Temps de chargement initial plus long
- Moins bonne expérience utilisateur

**Solution proposée**:

- Analyser les bundles avec `@next/bundle-analyzer`
- Lazy load plus de composants
- Optimiser les imports (éviter les imports par défaut de grandes bibliothèques)

**Priorité**: Faible

---

#### 8.2 Prefetching des données critiques

**Problème**: Pas de prefetching pour les données fréquemment utilisées.

**Impact**:

- Temps de chargement perçu plus long

**Solution proposée**:

- Utiliser `router.prefetch` pour les pages fréquemment visitées
- Prefetch des données dans le layout principal
- Utiliser les `<link rel="prefetch">` pour les assets critiques

**Priorité**: Faible

---

### 9. Documentation

#### 9.1 Documentation API manquante

**Problème**: Pas de documentation OpenAPI/Swagger pour les endpoints API.

**Impact**:

- Difficulté pour intégrer l'API
- Pas de documentation pour les développeurs

**Solution proposée**:

- Générer une documentation OpenAPI avec `swagger-jsdoc` ou similaire
- Endpoint `/api/docs` pour la documentation interactive
- Documentation des paramètres, réponses, et codes d'erreur

**Priorité**: Faible

---

#### 9.2 Documentation du sharding

**Problème**: Documentation limitée sur l'architecture de sharding.

**Impact**:

- Difficulté à comprendre et maintenir le système

**Solution proposée**:

- Créer `docs/SHARDING.md` avec :
  - Architecture détaillée
  - Guide de migration
  - Meilleures pratiques
  - Exemples d'utilisation

**Priorité**: Faible

---

## 📊 Résumé par Priorité

### Critique (À faire en premier)

1. ✅ Système d'authentification basé sur des sessions
2. ✅ Stockage de `puuid` et `riotRegion` dans User
3. ✅ Index manquants sur les tables
4. ✅ Résolution des requêtes N+1

### Important

5. ✅ Sauvegarde des compositions
6. ✅ Remplacement des `console.*` par logger
7. ✅ Tests d'intégration
8. ✅ Messages d'erreur i18n dans Zod
9. ✅ Alerting externe (Slack/PagerDuty)
10. ✅ Cache Redis
11. ✅ Rate limiting Redis

### Modéré

12. ✅ Stockage des runes
13. ✅ Gestion d'erreurs standardisée
14. ✅ Documentation API (OpenAPI)
15. ✅ Optimisation des bundles
16. ✅ Documentation du sharding

---

## 🎯 Recommandations Immédiates

Pour améliorer rapidement la qualité du code, je recommande de commencer par :

1. **Système d'authentification** (sécurité critique)
2. **Index manquants** (performance critique)
3. **Sauvegarde des compositions** (fonctionnalité principale manquante)
4. **Remplacement des `console.*`** (observabilité)
5. **Tests d'intégration** (confiance dans les changements)

---

**Dernière mise à jour**: 2025-01-17

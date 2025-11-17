# TODOs - Liste des améliorations à implémenter

Ce document liste tous les TODOs présents dans le code et leur statut.

## TODOs actifs

### 1. Optimisation de la recherche de compte League of Legends

**Fichier**: `app/api/auth/login/route.ts:82`
**Description**: Stocker `puuid` et `riotRegion` dans le modèle `User` pour optimiser la recherche de compte League of Legends lors de la connexion.
**Priorité**: Moyenne
**Impact**: Réduit le temps de connexion en évitant de chercher dans toutes les tables shardées.

### 2. Récupération de l'utilisateur depuis la session

**Fichier**: `app/api/user/save-riot-account/route.ts:20`
**Description**: Récupérer l'utilisateur depuis la session au lieu d'utiliser un header `x-user-id`.
**Priorité**: Haute
**Impact**: Améliore la sécurité en utilisant un système d'authentification standard.

### 3. Sauvegarde des compositions

**Fichier**: `app/compositions/create/page.tsx:94`
**Description**: Implémenter la sauvegarde des compositions créées par les utilisateurs.
**Priorité**: Haute
**Impact**: Fonctionnalité principale manquante pour permettre aux utilisateurs de sauvegarder leurs compositions.

### 4. Stockage des runes et de l'ordre des compétences

**Fichier**: `app/api/champions/[championId]/runes/route.ts:110`
**Description**: Ajouter le stockage des runes recommandées et de l'ordre des compétences pour chaque champion.
**Priorité**: Moyenne
**Impact**: Améliore l'expérience utilisateur en permettant de voir les runes et l'ordre des compétences recommandés.

### 5. Niveau du champion dans les matchs

**Fichier**: `app/summoners/[id]/overview/components/RecentMatchesList/MatchEntry.tsx:102`
**Description**: Afficher le niveau du champion si disponible dans les données de match.
**Priorité**: Faible
**Impact**: Améliore l'affichage des détails de match.

### 6. Implémentation d'une vraie IA avec ML

**Fichier**: `app/api/matches/suggest-composition/route.ts:62`
**Description**: Implémenter une vraie IA avec Machine Learning en analysant les matchs pour suggérer des compositions.
**Priorité**: Moyenne
**Impact**: Améliore la qualité des suggestions de compositions.

### 7. Logique de synergie basée sur les matchs gagnants

**Fichier**: `app/api/matches/suggest-composition/route.ts:82`
**Description**: Implémenter une logique de synergie basée sur l'analyse des matchs gagnants.
**Priorité**: Moyenne
**Impact**: Améliore la qualité des suggestions de compositions.

### 8. Scoring basé sur les matchs

**Fichier**: `app/api/matches/suggest-composition/route.ts:103`
**Description**: Implémenter un système de scoring basé sur l'analyse des matchs pour évaluer les compositions.
**Priorité**: Moyenne
**Impact**: Améliore la précision des suggestions de compositions.

## TODOs résolus

Aucun pour le moment.

## Notes

- Les TODOs sont classés par priorité : Haute, Moyenne, Faible
- Les TODOs liés à la sécurité (comme l'authentification) ont une priorité haute
- Les TODOs liés aux fonctionnalités principales ont une priorité haute
- Les TODOs d'amélioration ont une priorité moyenne ou faible

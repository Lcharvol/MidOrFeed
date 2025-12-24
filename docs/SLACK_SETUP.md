# Configuration de l'intégration Slack

Ce guide explique comment configurer l'intégration Slack pour recevoir des alertes automatiques depuis l'application.

## 📋 Prérequis

- Un compte Slack avec les permissions pour créer des webhooks
- Accès à votre workspace Slack

## 🔧 Configuration

### Étape 1 : Créer un Webhook Slack

1. **Ouvrir Slack Apps** :
   - Aller sur <https://api.slack.com/apps>
   - Se connecter avec votre compte Slack

2. **Créer une nouvelle App** :
   - Cliquer sur "Create New App"
   - Choisir "From scratch"
   - Donner un nom (ex: "MidOrFeed Alerts")
   - Sélectionner votre workspace

3. **Activer Incoming Webhooks** :
   - Dans le menu de gauche, aller dans "Incoming Webhooks"
   - Activer "Activate Incoming Webhooks" en basculant le switch

4. **Créer un Webhook** :
   - Cliquer sur "Add New Webhook to Workspace"
   - Choisir le canal où vous voulez recevoir les alertes (ex: `#alerts`, `#monitoring`)
   - Cliquer sur "Allow"
   - **Copier l'URL du webhook** (format: `https://hooks.slack.com/services/XXXXX/YYYYY/ZZZZZ`)

### Étape 2 : Configurer la variable d'environnement

Ajouter l'URL du webhook dans votre fichier `.env` :

```bash
# Slack Webhook pour les alertes
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXXXX/YYYYY/ZZZZZ
```

**Important** :

- En développement local : Ajouter dans `.env`
- En production (Fly.io) : Ajouter avec `fly secrets set SLACK_WEBHOOK_URL=https://...`
- Ne jamais commiter cette URL dans le code source !

### Étape 3 : Redémarrer l'application

Après avoir ajouté la variable d'environnement, redémarrer l'application pour que les changements prennent effet.

## 📨 Format des alertes

Les alertes Slack incluent :

- **Titre** : Niveau de sévérité et titre de l'alerte
- **Service** : Nom du service qui a déclenché l'alerte
- **Message** : Description détaillée de l'alerte
- **Timestamp** : Date et heure de l'alerte
- **Métadonnées** : Informations contextuelles supplémentaires (si disponibles)
- **Couleur** : Codage couleur selon la sévérité
  - 🟢 **LOW** (Vert) : Alertes d'information
  - 🟠 **MEDIUM** (Orange) : Alertes modérées nécessitant attention
  - 🔴 **HIGH** (Rouge) : Alertes importantes nécessitant action immédiate
  - 🔴 **CRITICAL** (Rouge foncé) : Alertes critiques nécessitant intervention urgente

## 🔍 Niveaux de sévérité

### LOW

Alertes informatives, pas d'action immédiate requise.

### MEDIUM

Problèmes modérés nécessitant un suivi (ex: erreurs de connexion API, tentatives de connexion suspectes).

### HIGH

Problèmes importants nécessitant une action rapide (ex: erreurs de base de données, taux d'erreur élevé).

### CRITICAL

Problèmes critiques nécessitant une intervention immédiate (ex: base de données inaccessible, erreurs de sécurité).

## 🧪 Tester l'intégration

### Méthode 1 : Déclencher une alerte manuelle

Créer un fichier temporaire de test (à supprimer après) :

```typescript
// test-slack-alert.ts
import { alerting } from "@/lib/alerting";

alerting.low("Test d'alerte", "Ceci est un test d'intégration Slack", "test");
alerting.medium("Test d'alerte moyenne", "Test avec métadonnées", "test", {
  userId: "test-123",
  action: "test-alert",
});
```

Puis exécuter avec `tsx` :

```bash
pnpm tsx test-slack-alert.ts
```

### Méthode 2 : Via les alertes automatiques en production

Les alertes sont automatiquement envoyées à Slack lorsqu'elles sont déclenchées dans le code, notamment :

- Erreurs critiques lors de la connexion (via `alerting.medium()` dans `/api/auth/login`)
- Problèmes de synchronisation des données
- Erreurs de base de données
- Alertes de monitoring (via `withApiMonitoring`)

**Note** : Les alertes sont envoyées dès que `SLACK_WEBHOOK_URL` est configuré, même en développement, pour faciliter les tests.

## 🔒 Sécurité

- **Ne jamais commiter l'URL du webhook** dans le code source
- Utiliser des variables d'environnement sécurisées
- En production, utiliser `fly secrets set` pour configurer les secrets
- Vérifier régulièrement les logs pour détecter d'éventuels abus

## 📝 Exemples d'alertes

### Exemple d'alerte LOW

```
🟢 LOW: Tentative de connexion avec email inexistant
Service: auth
Message: Tentative de connexion avec email inexistant
Metadata: { email: "test@example.com" }
```

### Exemple d'alerte CRITICAL

```
🔴 CRITICAL: Base de données inaccessible
Service: database
Message: Impossible de se connecter à la base de données
Metadata: { error: "Connection timeout", host: "127.0.0.1:5432" }
```

## 🛠️ Dépannage

### Les alertes n'arrivent pas dans Slack

1. **Vérifier la variable d'environnement** :

   ```bash
   # En développement
   echo $SLACK_WEBHOOK_URL
   # ou vérifier dans .env
   
   # En production (Fly.io)
   fly secrets list
   ```

2. **Tester avec le script de test** :

   ```bash
   pnpm test:slack
   ```

   Le script vous dira si `SLACK_WEBHOOK_URL` est configuré ou non.

3. **Vérifier les logs de l'application** :
   Les erreurs d'envoi sont loggées dans les logs avec `Failed to send alert to Slack`

   ```bash
   # En développement, vérifier la console
   # En production
   fly logs
   ```

4. **Tester l'URL du webhook manuellement** :

   ```bash
   curl -X POST https://hooks.slack.com/services/XXXXX/YYYYY/ZZZZZ \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test"}'
   ```

   Si cela fonctionne, vous devriez voir "ok" dans la réponse et un message dans Slack.

5. **Vérifier que l'app Slack est bien activée** :
   - Retourner sur <https://api.slack.com/apps>
   - Sélectionner votre app
   - Aller dans "Incoming Webhooks"
   - Vérifier que "Activate Incoming Webhooks" est activé
   - Vérifier que le webhook n'a pas été révoqué (il devrait apparaître dans la liste)

### Modifier le canal de réception

1. Aller dans <https://api.slack.com/apps>
2. Sélectionner votre app
3. Aller dans "Incoming Webhooks"
4. Cliquer sur "Add New Webhook to Workspace"
5. Choisir le nouveau canal
6. L'URL reste la même, le canal change automatiquement

## 📚 Ressources

- [Documentation Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Guide de création d'app Slack](https://api.slack.com/authentication/basics)

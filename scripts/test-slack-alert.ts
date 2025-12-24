/**
 * Script de test pour l'intégration Slack
 * Utilise pour tester que les alertes sont bien envoyées à Slack
 *
 * Usage:
 *   pnpm tsx scripts/test-slack-alert.ts
 */

// Charger les variables d'environnement depuis .env
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Pour ES modules, obtenir __dirname équivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger le fichier .env depuis la racine du projet
config({ path: resolve(__dirname, "../.env") });

import { alerting } from "../lib/alerting";

async function testSlackAlerts() {
  console.log("🧪 Test des alertes Slack...\n");

  // Vérifier que SLACK_WEBHOOK_URL est configuré
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log(
      "⚠️  SLACK_WEBHOOK_URL n'est pas configuré dans les variables d'environnement"
    );
    console.log("   Ajoutez-le dans votre fichier .env :");
    console.log(
      "   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXXXX/YYYYY/ZZZZZ\n"
    );
    console.log(
      "   Consultez docs/SLACK_SETUP.md pour les instructions détaillées.\n"
    );
    process.exit(1);
  }

  console.log("✅ SLACK_WEBHOOK_URL configuré\n");
  console.log(
    "📨 Envoi de 4 alertes de test (une par niveau de sévérité)...\n"
  );

  // Test d'alerte LOW (verte)
  console.log("1️⃣  Envoi d'une alerte LOW...");
  alerting.low(
    "Test d'alerte LOW",
    "Ceci est un test d'intégration Slack de niveau LOW",
    "test",
    {
      testId: "low-001",
      timestamp: new Date().toISOString(),
    }
  );

  // Attendre un peu pour éviter le rate limiting
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test d'alerte MEDIUM (orange)
  console.log("2️⃣  Envoi d'une alerte MEDIUM...");
  alerting.medium(
    "Test d'alerte MEDIUM",
    "Ceci est un test d'intégration Slack de niveau MEDIUM",
    "test",
    {
      testId: "medium-001",
      userId: "test-user-123",
      action: "test-alert",
    }
  );

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test d'alerte HIGH (rouge)
  console.log("3️⃣  Envoi d'une alerte HIGH...");
  alerting.high(
    "Test d'alerte HIGH",
    "Ceci est un test d'intégration Slack de niveau HIGH",
    "test",
    {
      testId: "high-001",
      errorCode: "TEST_ERROR",
      endpoint: "/api/test",
    }
  );

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test d'alerte CRITICAL (rouge foncé)
  console.log("4️⃣  Envoi d'une alerte CRITICAL...");
  alerting.critical(
    "Test d'alerte CRITICAL",
    "Ceci est un test d'intégration Slack de niveau CRITICAL",
    "test",
    {
      testId: "critical-001",
      severity: "critical",
      requiresImmediateAction: true,
    }
  );

  console.log("\n✅ Tous les tests ont été envoyés !");
  console.log("📱 Vérifiez votre canal Slack pour voir les alertes.\n");
  console.log("💡 Note: Les alertes sont envoyées de manière asynchrone,");
  console.log("   elles peuvent arriver avec un léger délai.\n");
}

testSlackAlerts().catch((error) => {
  console.error("❌ Erreur lors du test:", error);
  process.exit(1);
});

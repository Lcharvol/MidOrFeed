#!/bin/bash
set -e

POSTGRES_APP="midorfeed"
WEB_APP="lol-comp-maker-blue-violet-4218"

echo "🔍 Récupération du mot de passe PostgreSQL depuis $POSTGRES_APP..."

# Récupérer le mot de passe via SSH
PASSWORD=$(fly ssh console -a "$POSTGRES_APP" -C "printenv OPERATOR_PASSWORD" 2>/dev/null | grep -v "Connecting" | grep -v "^$" | head -1)

if [ -z "$PASSWORD" ]; then
  echo "⚠️  Impossible de récupérer le mot de passe automatiquement."
  echo "📝 Veuillez récupérer le mot de passe manuellement:"
  echo "   1. Allez sur https://fly.io/apps/$POSTGRES_APP/secrets"
  echo "   2. Récupérez OPERATOR_PASSWORD ou SU_PASSWORD"
  echo "   3. Exécutez:"
  echo "      fly secrets set DATABASE_URL=\"postgresql://postgres:VOTRE_PASSWORD@$POSTGRES_APP.internal:5432/postgres?sslmode=disable\" -a $WEB_APP"
  exit 1
fi

# Construire la DATABASE_URL
DATABASE_URL="postgresql://postgres:${PASSWORD}@${POSTGRES_APP}.internal:5432/postgres?sslmode=disable"

echo "✅ Configuration de DATABASE_URL pour $WEB_APP..."
fly secrets set DATABASE_URL="$DATABASE_URL" -a "$WEB_APP"

echo "✅ DATABASE_URL configurée avec succès!"
echo "🔄 Redémarrez l'application avec: fly deploy -a $WEB_APP"


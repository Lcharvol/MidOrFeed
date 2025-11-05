#!/bin/bash
set -e

APP_NAME="lol-comp-maker-blue-violet-4218"
POSTGRES_APP="midorfeed"
LOCAL_PORT=5433
STUDIO_PORT=5555

# Fonction pour trouver un port libre
find_free_port() {
  local port=$1
  while lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; do
    port=$((port + 1))
  done
  echo $port
}

echo "🔍 Récupération des informations de connexion PostgreSQL..."

# Récupérer le mot de passe
PASSWORD=$(fly ssh console -a "$POSTGRES_APP" -C "printenv OPERATOR_PASSWORD" 2>/dev/null | grep -v "Connecting" | grep -v "^$" | head -1)

if [ -z "$PASSWORD" ]; then
  echo "❌ Impossible de récupérer le mot de passe PostgreSQL"
  exit 1
fi

echo "✅ Mot de passe récupéré"
echo "🔗 Création du tunnel SSH vers PostgreSQL (port local: $LOCAL_PORT)..."
echo ""

# Fonction de nettoyage
cleanup() {
  echo ""
  echo "🧹 Nettoyage du tunnel..."
  kill $TUNNEL_PID 2>/dev/null || true
  wait $TUNNEL_PID 2>/dev/null || true
  echo "✅ Tunnel fermé"
}

# Capturer Ctrl+C pour nettoyer
trap cleanup EXIT INT TERM

# Créer le tunnel en arrière-plan
fly proxy "$LOCAL_PORT:5432" -a "$POSTGRES_APP" > /dev/null 2>&1 &
TUNNEL_PID=$!

# Attendre que le tunnel soit prêt
echo "⏳ Attente de la connexion..."
sleep 3

# Vérifier que le tunnel fonctionne
if ! kill -0 $TUNNEL_PID 2>/dev/null; then
  echo "❌ Échec de la création du tunnel"
  exit 1
fi

echo "✅ Tunnel créé (PID: $TUNNEL_PID)"

# Vérifier si le port Studio est libre, sinon en trouver un autre
if lsof -Pi :$STUDIO_PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo "⚠️  Le port $STUDIO_PORT est déjà utilisé, recherche d'un port libre..."
  STUDIO_PORT=$(find_free_port $STUDIO_PORT)
  echo "✅ Port libre trouvé: $STUDIO_PORT"
fi

echo "🚀 Lancement de Prisma Studio sur http://localhost:$STUDIO_PORT"
echo "💡 Appuyez sur Ctrl+C pour arrêter"
echo ""

# Construire la DATABASE_URL pour la connexion locale via tunnel
export DATABASE_URL="postgresql://postgres:${PASSWORD}@localhost:${LOCAL_PORT}/postgres?sslmode=disable"

# Lancer Prisma Studio
pnpm prisma studio --port "$STUDIO_PORT"


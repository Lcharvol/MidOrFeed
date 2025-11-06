#!/bin/bash
set -e

# Attendre que PostgreSQL soit prêt
until pg_isready -U postgres; do
  sleep 1
done

# Définir le mot de passe pour l'utilisateur postgres
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# Modifier pg_hba.conf pour utiliser trust pour toutes les connexions externes (développement local uniquement)
# Supprimer la ligne générique problématique
sed -i '/^host all all all scram-sha-256$/d' /var/lib/postgresql/data/pg_hba.conf || true
sed -i '/^host all all all md5$/d' /var/lib/postgresql/data/pg_hba.conf || true
sed -i '/^host all all all trust$/d' /var/lib/postgresql/data/pg_hba.conf || true

# S'assurer que les connexions externes utilisent trust
if ! grep -q "host all all 0.0.0.0/0 trust" /var/lib/postgresql/data/pg_hba.conf; then
  echo "host all all 0.0.0.0/0 trust" >> /var/lib/postgresql/data/pg_hba.conf
fi
if ! grep -q "host all all ::/0 trust" /var/lib/postgresql/data/pg_hba.conf; then
  echo "host all all ::/0 trust" >> /var/lib/postgresql/data/pg_hba.conf
fi

# Recharger la configuration
psql -U postgres -c "SELECT pg_reload_conf();"

echo "PostgreSQL configured with trust authentication for external connections"


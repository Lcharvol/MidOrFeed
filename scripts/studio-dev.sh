#!/bin/bash
set -e

# Prisma Studio (dev/local DB)
# Uses DATABASE_URL from .env by default, or an override via CLI:
#   DATABASE_URL="postgresql://user:pass@localhost:5432/db?sslmode=disable" pnpm prisma:studio:dev

if [ -z "$DATABASE_URL" ]; then
  # Load .env if present
  if [ -f ./.env ]; then
    # shellcheck disable=SC2046
    export $(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' ./.env | xargs) >/dev/null 2>&1 || true
  fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL non définie. Exemple local:"
  echo "  postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable"
  exit 1
fi

echo "Utilisation de DATABASE_URL: $DATABASE_URL"
pnpm prisma studio



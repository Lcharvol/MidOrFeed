#!/bin/sh

echo "Running Prisma migrations..."
# Use Prisma CLI bundled in the standalone output's node_modules
if [ -f "node_modules/prisma/build/index.js" ]; then
  node node_modules/prisma/build/index.js migrate deploy || echo "Migration failed, continuing anyway..."
elif command -v pnpm >/dev/null 2>&1; then
  # Fallback: use pnpm dlx with pinned version (Prisma 7 has breaking changes)
  pnpm dlx prisma@6.18.0 migrate deploy || echo "Migration failed, continuing anyway..."
elif command -v npx >/dev/null 2>&1; then
  # Fallback: try npx with pinned version
  npx prisma@6.18.0 migrate deploy || echo "Migration failed, continuing anyway..."
else
  echo "Prisma CLI not found, skipping migrations..."
fi

echo "Starting Next.js server..."
exec node server.js


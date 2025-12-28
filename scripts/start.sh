#!/bin/sh

# Migrations are handled by fly.toml release_command, no need to run them here
# This script just starts the Next.js server

echo "Starting Next.js server..."
exec node server.js

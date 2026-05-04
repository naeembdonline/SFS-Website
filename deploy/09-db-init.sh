#!/bin/bash
# ===================================================================
# Database Migration + Seed Runner
# Run from app directory after .env.production is configured
# ===================================================================

set -e

APP_DIR="${APP_DIR:-/home/deploy/sfs-app}"
cd ${APP_DIR}

# Load env
set -a
source .env.production
set +a

echo "=== Generating migrations (if needed) ==="
npm run db:generate || echo "No new migrations to generate"

echo "=== Pushing schema to database ==="
npm run db:push

echo "=== Running seed ==="
npm run db:seed || echo "Seed failed or already exists - continuing"

echo ""
echo "=== Database initialized ==="
echo "Verify with: psql \$DATABASE_URL -c '\\dt'"

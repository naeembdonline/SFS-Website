#!/bin/bash
# ===================================================================
# Next.js Application Deploy Script
# Run as deploy user
# ===================================================================

set -e

APP_DIR="/home/deploy/sfs-app"
REPO_URL="${1:-}"  # Pass repo URL as first argument

if [ -z "$REPO_URL" ]; then
  echo "Usage: ./04-app-deploy.sh <git-repo-url>"
  exit 1
fi

echo "=== Cloning repository ==="
if [ -d "$APP_DIR" ]; then
  cd $APP_DIR
  git pull
else
  git clone $REPO_URL $APP_DIR
  cd $APP_DIR
fi

echo "=== Installing dependencies ==="
npm ci --production=false

echo "=== Setting up environment ==="
if [ ! -f .env.production ]; then
  cp deploy/.env.production.template .env.production
  echo ""
  echo "!!! IMPORTANT !!!"
  echo "Edit .env.production with your actual credentials before continuing"
  echo "  - DATABASE_URL (from /root/postgres-credentials.txt)"
  echo "  - MinIO keys (from /root/minio-credentials.txt)"
  echo "  - SESSION_SECRET (run: openssl rand -base64 32)"
  echo ""
  read -p "Press Enter when done..."
fi

echo "=== Running database migrations ==="
npm run db:migrate || echo "No migrate script found, skipping"

echo "=== Building application ==="
npm run build

echo "=== Setting up PM2 ==="
pm2 delete sfs-app 2>/dev/null || true
pm2 start npm --name "sfs-app" -- start
pm2 save
pm2 startup systemd -u deploy --hp /home/deploy

echo ""
echo "=== Application deployed ==="
echo "Status:"
pm2 status
echo ""
echo "Logs: pm2 logs sfs-app"
echo "Restart: pm2 restart sfs-app"

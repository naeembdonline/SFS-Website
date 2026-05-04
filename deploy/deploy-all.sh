#!/bin/bash
# ===================================================================
# Master Deploy Script - Runs everything in correct order
# Usage:
#   ./deploy-all.sh <domain> <email> <git-repo-url>
# ===================================================================

set -e

DOMAIN="${1:-}"
EMAIL="${2:-}"
REPO_URL="${3:-}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ] || [ -z "$REPO_URL" ]; then
  cat <<EOF
Usage: ./deploy-all.sh <domain> <email> <git-repo-url>

Example:
  ./deploy-all.sh example.com admin@example.com https://github.com/user/sfs.git

Before running:
  1. Point DNS A records to this VPS IP:
     - example.com
     - www.example.com
     - cdn.example.com
  2. Wait for DNS propagation (5-10 minutes)
  3. Run this script as root
EOF
  exit 1
fi

if [ "$EUID" -ne 0 ]; then
  echo "ERROR: Must run as root (use sudo)"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd ${SCRIPT_DIR}
chmod +x *.sh

echo "╔════════════════════════════════════════════╗"
echo "║   SFS VPS Deployment - $(date +%Y-%m-%d)    ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Phase 1: Foundation
echo "▶ [1/13] Swap setup..."
./00-swap-setup.sh 4G

echo "▶ [2/13] System packages, firewall, Node.js..."
./01-initial-setup.sh

echo "▶ [3/13] PostgreSQL..."
./02-postgres-setup.sh

echo "▶ [4/13] MinIO object storage..."
./03-minio-setup.sh

echo "▶ [5/13] Redis hardening..."
./10-redis-secure.sh

# Phase 2: App
echo "▶ [6/13] Cloning and building app (as deploy user)..."
sudo -u deploy bash -c "cd /home/deploy && git clone ${REPO_URL} sfs-app || (cd sfs-app && git pull)"

# Generate .env.production from template + credentials
DB_PASS=$(grep "Password:" /root/postgres-credentials.txt | awk '{print $2}')
MINIO_USER=$(grep "Access Key:" /root/minio-credentials.txt | awk '{print $3}')
MINIO_PASS=$(grep "Secret Key:" /root/minio-credentials.txt | awk '{print $3}')
REDIS_PASS=$(grep "Redis Password:" /root/redis-credentials.txt | awk '{print $3}')
SESSION_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

cat > /home/deploy/sfs-app/.env.production <<EOF
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
NEXT_PUBLIC_CDN_HOST=cdn.${DOMAIN}
PORT=3000

DATABASE_URL=postgresql://sfs_user:${DB_PASS}@localhost:5432/sfs_db

R2_ACCOUNT_ID=minio
R2_ACCESS_KEY_ID=${MINIO_USER}
R2_SECRET_ACCESS_KEY=${MINIO_PASS}
R2_BUCKET_PUBLIC=public
R2_BUCKET_PRIVATE=private
R2_ENDPOINT=http://localhost:9000
R2_PUBLIC_URL=https://cdn.${DOMAIN}
R2_FORCE_PATH_STYLE=true

SMTP_HOST=localhost
SMTP_PORT=25
SMTP_SECURE=false
SMTP_FROM=noreply@${DOMAIN}

SESSION_SECRET=${SESSION_SECRET}
JWT_SECRET=${JWT_SECRET}

REDIS_URL=redis://:${REDIS_PASS}@localhost:6379
EOF

chown deploy:deploy /home/deploy/sfs-app/.env.production
chmod 600 /home/deploy/sfs-app/.env.production

echo "▶ [7/13] Installing dependencies and building..."
sudo -u deploy bash -c "cd /home/deploy/sfs-app && npm ci && npm run build"

echo "▶ [8/13] Database migrations and seed..."
sudo -u deploy bash -c "cd /home/deploy/sfs-app && APP_DIR=/home/deploy/sfs-app ${SCRIPT_DIR}/09-db-init.sh"

echo "▶ [9/13] Starting app with PM2..."
sudo -u deploy bash -c "cd /home/deploy/sfs-app && pm2 start ${SCRIPT_DIR}/ecosystem.config.js"
sudo -u deploy pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy

echo "▶ [10/13] PM2 log rotation..."
sudo -u deploy bash ${SCRIPT_DIR}/11-pm2-logrotate.sh

# Phase 3: Network
echo "▶ [11/13] Nginx + SSL..."
./05-nginx-ssl.sh ${DOMAIN} ${EMAIL}

echo "▶ [12/13] MinIO bucket policies + CORS..."
./08-minio-policies.sh ${DOMAIN}

# Phase 4: Reliability
echo "▶ [13/13] Monitoring + watchdog..."
./13-monitoring.sh ${DOMAIN}

# Setup automated backup cron
echo "▶ Setting up daily backups..."
(crontab -l 2>/dev/null | grep -v sfs-backup; echo "0 2 * * * ${SCRIPT_DIR}/07-backup.sh >> /var/log/sfs-backup.log 2>&1") | crontab -
(crontab -l 2>/dev/null | grep -v offsite-backup; echo "0 3 * * * ${SCRIPT_DIR}/12-offsite-backup.sh >> /var/log/sfs-offsite-backup.log 2>&1") | crontab -

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║         🎉 DEPLOYMENT COMPLETE 🎉          ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "Site:        https://${DOMAIN}"
echo "CDN:         https://cdn.${DOMAIN}"
echo "Health:      https://${DOMAIN}/api/health"
echo "Monitor:     https://monitor.${DOMAIN}"
echo ""
echo "Credentials saved to:"
echo "  /root/postgres-credentials.txt"
echo "  /root/minio-credentials.txt"
echo "  /root/redis-credentials.txt"
echo "  /root/monitoring-credentials.txt"
echo ""
echo "Manual TODO:"
echo "  1. Edit /etc/sfs-backup.env with Cloudflare R2 credentials"
echo "  2. Setup external uptime monitor (UptimeRobot/BetterStack)"
echo "  3. Optional: ./06-postfix-email.sh ${DOMAIN} for self-hosted email"
echo ""
echo "App control:"
echo "  pm2 status              # Check status"
echo "  pm2 logs sfs-app        # View logs"
echo "  pm2 restart sfs-app     # Restart"

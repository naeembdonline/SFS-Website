#!/bin/bash
# ===================================================================
# VPS Initial Setup Script
# Ubuntu 22.04 / 24.04 LTS
# Run as root or with sudo
# ===================================================================

set -e

echo "=== Step 1: System Update ==="
apt update && apt upgrade -y

echo "=== Step 2: Install Essential Packages ==="
apt install -y \
  curl \
  wget \
  git \
  build-essential \
  ufw \
  fail2ban \
  nginx \
  certbot \
  python3-certbot-nginx \
  postgresql \
  postgresql-contrib \
  redis-server \
  unzip

echo "=== Step 3: Install Node.js 20 LTS ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "=== Step 4: Install PM2 (Process Manager) ==="
npm install -g pm2

echo "=== Step 5: Configure Firewall ==="
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 9000/tcp  # MinIO API
ufw allow 9001/tcp  # MinIO Console
ufw --force enable

echo "=== Step 6: Configure Fail2Ban ==="
systemctl enable fail2ban
systemctl start fail2ban

echo "=== Step 7: Create deploy user ==="
if ! id -u deploy &>/dev/null; then
  useradd -m -s /bin/bash deploy
  usermod -aG sudo deploy
  echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy
fi

echo ""
echo "=== Initial setup complete! ==="
echo "Next steps:"
echo "  1. Run ./02-postgres-setup.sh"
echo "  2. Run ./03-minio-setup.sh"
echo "  3. Run ./04-app-deploy.sh"
echo "  4. Run ./05-nginx-ssl.sh"

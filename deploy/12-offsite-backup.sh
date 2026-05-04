#!/bin/bash
# ===================================================================
# Offsite Backup to Cloudflare R2 (Free Tier - 10GB)
# VPS crash হলেও backup নিরাপদ থাকবে
# ===================================================================

set -e

BACKUP_DIR="/var/backups/sfs"
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30

# Cloudflare R2 credentials (set in /etc/sfs-backup.env)
if [ ! -f /etc/sfs-backup.env ]; then
  cat > /etc/sfs-backup.env <<'EOF'
# Cloudflare R2 (free 10GB) — fill these in
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BACKUP_BUCKET=sfs-backups
EOF
  chmod 600 /etc/sfs-backup.env
  echo "Created /etc/sfs-backup.env - fill in R2 credentials and re-run"
  exit 1
fi

source /etc/sfs-backup.env

if [ -z "$R2_ACCOUNT_ID" ] || [ -z "$R2_ACCESS_KEY_ID" ]; then
  echo "ERROR: R2 credentials not set in /etc/sfs-backup.env"
  exit 1
fi

mkdir -p ${BACKUP_DIR}/{postgres,minio}

echo "=== Local backup ==="
sudo -u postgres pg_dump sfs_db | gzip > ${BACKUP_DIR}/postgres/sfs_db-${DATE}.sql.gz
tar -czf ${BACKUP_DIR}/minio/minio-${DATE}.tar.gz -C /data minio

echo "=== Configuring rclone for R2 ==="
if ! command -v rclone &>/dev/null; then
  curl https://rclone.org/install.sh | bash
fi

mkdir -p /root/.config/rclone
cat > /root/.config/rclone/rclone.conf <<EOF
[r2]
type = s3
provider = Cloudflare
access_key_id = ${R2_ACCESS_KEY_ID}
secret_access_key = ${R2_SECRET_ACCESS_KEY}
endpoint = https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
acl = private
EOF
chmod 600 /root/.config/rclone/rclone.conf

# Ensure bucket exists
rclone mkdir r2:${R2_BACKUP_BUCKET} 2>/dev/null || true

echo "=== Uploading to R2 ==="
rclone copy ${BACKUP_DIR}/postgres/sfs_db-${DATE}.sql.gz r2:${R2_BACKUP_BUCKET}/postgres/ --progress
rclone copy ${BACKUP_DIR}/minio/minio-${DATE}.tar.gz r2:${R2_BACKUP_BUCKET}/minio/ --progress

echo "=== Cleaning up old offsite backups (>${RETENTION_DAYS} days) ==="
rclone delete r2:${R2_BACKUP_BUCKET}/postgres/ --min-age ${RETENTION_DAYS}d
rclone delete r2:${R2_BACKUP_BUCKET}/minio/ --min-age ${RETENTION_DAYS}d

echo "=== Cleaning up local backups (>14 days) ==="
find ${BACKUP_DIR}/postgres -name "*.sql.gz" -mtime +14 -delete
find ${BACKUP_DIR}/minio -name "*.tar.gz" -mtime +14 -delete

echo ""
echo "=== Offsite backup complete: ${DATE} ==="
echo "Local: ${BACKUP_DIR}"
echo "Remote: r2:${R2_BACKUP_BUCKET}"
rclone size r2:${R2_BACKUP_BUCKET}

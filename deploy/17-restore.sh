#!/bin/bash
# ===================================================================
# Backup Restore Script
# Usage:
#   ./17-restore.sh postgres <backup-file.sql.gz>
#   ./17-restore.sh minio    <backup-file.tar.gz>
#   ./17-restore.sh latest   (restores most recent local backup)
#   ./17-restore.sh offsite  (downloads latest from R2 then restores)
# ===================================================================

set -e

BACKUP_DIR="/var/backups/sfs"
ACTION="${1:-}"
TARGET="${2:-}"

if [ "$EUID" -ne 0 ]; then
  echo "ERROR: Run as root"
  exit 1
fi

confirm() {
  echo ""
  echo "⚠️  WARNING: This will OVERWRITE current data!"
  read -p "Type 'YES' to continue: " ans
  if [ "$ans" != "YES" ]; then
    echo "Aborted."
    exit 1
  fi
}

restore_postgres() {
  local file="$1"
  if [ ! -f "$file" ]; then
    echo "ERROR: File not found: $file"
    exit 1
  fi

  echo "=== Restoring PostgreSQL from $file ==="
  confirm

  # Stop app to release connections
  sudo -u deploy pm2 stop sfs-app || true

  # Drop and recreate
  sudo -u postgres psql <<EOF
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='sfs_db' AND pid<>pg_backend_pid();
DROP DATABASE IF EXISTS sfs_db;
CREATE DATABASE sfs_db OWNER sfs_user;
EOF

  # Restore
  if [[ "$file" == *.gz ]]; then
    gunzip < "$file" | sudo -u postgres psql sfs_db
  else
    sudo -u postgres psql sfs_db < "$file"
  fi

  sudo -u deploy pm2 start sfs-app
  echo "✅ PostgreSQL restored"
}

restore_minio() {
  local file="$1"
  if [ ! -f "$file" ]; then
    echo "ERROR: File not found: $file"
    exit 1
  fi

  echo "=== Restoring MinIO from $file ==="
  confirm

  systemctl stop minio
  rm -rf /data/minio.bak
  mv /data/minio /data/minio.bak
  tar -xzf "$file" -C /data
  chown -R minio-user:minio-user /data/minio
  systemctl start minio

  echo "✅ MinIO restored (old data backed up to /data/minio.bak)"
}

case "$ACTION" in
  postgres)
    restore_postgres "$TARGET"
    ;;
  minio)
    restore_minio "$TARGET"
    ;;
  latest)
    LATEST_PG=$(ls -t ${BACKUP_DIR}/postgres/*.sql.gz 2>/dev/null | head -1)
    LATEST_MINIO=$(ls -t ${BACKUP_DIR}/minio/*.tar.gz 2>/dev/null | head -1)
    if [ -z "$LATEST_PG" ]; then
      echo "ERROR: No local backups found"
      exit 1
    fi
    echo "Latest postgres: $LATEST_PG"
    echo "Latest minio:    $LATEST_MINIO"
    restore_postgres "$LATEST_PG"
    [ -n "$LATEST_MINIO" ] && restore_minio "$LATEST_MINIO"
    ;;
  offsite)
    if ! command -v rclone &>/dev/null; then
      echo "ERROR: rclone not installed"
      exit 1
    fi
    if [ ! -f /etc/sfs-backup.env ]; then
      echo "ERROR: /etc/sfs-backup.env missing"
      exit 1
    fi
    source /etc/sfs-backup.env

    echo "=== Downloading latest from R2 ==="
    LATEST_PG=$(rclone lsf r2:${R2_BACKUP_BUCKET}/postgres/ | sort -r | head -1)
    LATEST_MINIO=$(rclone lsf r2:${R2_BACKUP_BUCKET}/minio/ | sort -r | head -1)

    mkdir -p /tmp/restore
    rclone copy r2:${R2_BACKUP_BUCKET}/postgres/${LATEST_PG} /tmp/restore/ --progress
    rclone copy r2:${R2_BACKUP_BUCKET}/minio/${LATEST_MINIO} /tmp/restore/ --progress

    restore_postgres "/tmp/restore/${LATEST_PG}"
    restore_minio "/tmp/restore/${LATEST_MINIO}"
    rm -rf /tmp/restore
    ;;
  test)
    # Restore drill — restore latest backup to a TEMP database, verify, drop
    LATEST_PG=$(ls -t ${BACKUP_DIR}/postgres/*.sql.gz 2>/dev/null | head -1)
    if [ -z "$LATEST_PG" ]; then
      echo "ERROR: No backups to test"
      exit 1
    fi
    echo "=== Test-restoring $LATEST_PG to sfs_db_restore_test ==="
    sudo -u postgres dropdb --if-exists sfs_db_restore_test
    sudo -u postgres createdb sfs_db_restore_test
    gunzip < "$LATEST_PG" | sudo -u postgres psql sfs_db_restore_test >/dev/null
    TABLE_COUNT=$(sudo -u postgres psql -d sfs_db_restore_test -tAc "SELECT count(*) FROM pg_tables WHERE schemaname='public'")
    sudo -u postgres dropdb sfs_db_restore_test
    if [ "$TABLE_COUNT" -gt 0 ]; then
      echo "✅ Backup is valid ($TABLE_COUNT tables restored)"
    else
      echo "❌ Backup appears empty!"
      exit 1
    fi
    ;;
  *)
    cat <<EOF
Usage: $0 <action> [target]

Actions:
  postgres <file.sql.gz>   Restore PostgreSQL from file
  minio    <file.tar.gz>   Restore MinIO from file
  latest                   Restore latest local backup (both)
  offsite                  Download + restore latest from Cloudflare R2
  test                     Verify latest backup is restorable (drill)

Examples:
  $0 postgres /var/backups/sfs/postgres/sfs_db-20260504-020000.sql.gz
  $0 latest
  $0 test
EOF
    exit 1
    ;;
esac

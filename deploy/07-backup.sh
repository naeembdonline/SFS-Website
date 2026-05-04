#!/bin/bash
# ===================================================================
# Automated Backup Script
# Schedule via cron: 0 2 * * * /home/deploy/sfs-app/deploy/07-backup.sh
# ===================================================================

set -e

BACKUP_DIR="/var/backups/sfs"
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=14

mkdir -p ${BACKUP_DIR}/{postgres,minio}

# Database backup
echo "=== Backing up PostgreSQL ==="
sudo -u postgres pg_dump sfs_db | gzip > ${BACKUP_DIR}/postgres/sfs_db-${DATE}.sql.gz

# MinIO backup
echo "=== Backing up MinIO data ==="
tar -czf ${BACKUP_DIR}/minio/minio-${DATE}.tar.gz -C /data minio

# Cleanup old backups
find ${BACKUP_DIR}/postgres -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete
find ${BACKUP_DIR}/minio -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "=== Backup complete: ${DATE} ==="
ls -lh ${BACKUP_DIR}/postgres/sfs_db-${DATE}.sql.gz
ls -lh ${BACKUP_DIR}/minio/minio-${DATE}.tar.gz

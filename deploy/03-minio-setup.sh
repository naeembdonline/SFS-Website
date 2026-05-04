#!/bin/bash
# ===================================================================
# MinIO Setup Script (S3-compatible object storage)
# ===================================================================

set -e

MINIO_ROOT_USER="minioadmin"
MINIO_ROOT_PASS=$(openssl rand -base64 24)

echo "=== Installing MinIO ==="

# Download MinIO server
wget -q https://dl.min.io/server/minio/release/linux-amd64/minio -O /usr/local/bin/minio
chmod +x /usr/local/bin/minio

# Download MinIO client
wget -q https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/local/bin/mc
chmod +x /usr/local/bin/mc

# Create minio user and data directory
useradd -r minio-user -s /sbin/nologin || true
mkdir -p /data/minio
mkdir -p /etc/minio
chown -R minio-user:minio-user /data/minio /etc/minio

# Environment file
cat > /etc/default/minio <<EOF
MINIO_VOLUMES="/data/minio"
MINIO_OPTS="--console-address :9001"
MINIO_ROOT_USER="${MINIO_ROOT_USER}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASS}"
EOF

# Systemd service
cat > /etc/systemd/system/minio.service <<'EOF'
[Unit]
Description=MinIO Object Storage
Documentation=https://docs.min.io
Wants=network-online.target
After=network-online.target

[Service]
WorkingDirectory=/usr/local/
User=minio-user
Group=minio-user
EnvironmentFile=/etc/default/minio
ExecStartPre=/bin/bash -c "if [ -z \"${MINIO_VOLUMES}\" ]; then echo \"Variable MINIO_VOLUMES not set\"; exit 1; fi"
ExecStart=/usr/local/bin/minio server $MINIO_OPTS $MINIO_VOLUMES
Restart=always
LimitNOFILE=65536
TasksMax=infinity
TimeoutStopSec=infinity
SendSIGKILL=no

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable minio
systemctl start minio

sleep 5

# Configure MinIO client and create buckets
mc alias set local http://localhost:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASS}
mc mb local/public --ignore-existing
mc mb local/private --ignore-existing
mc anonymous set download local/public

# Save credentials
cat > /root/minio-credentials.txt <<EOF
MinIO Console: http://YOUR_VPS_IP:9001
Access Key: ${MINIO_ROOT_USER}
Secret Key: ${MINIO_ROOT_PASS}
API Endpoint: http://localhost:9000
Public Bucket: public
Private Bucket: private
EOF

chmod 600 /root/minio-credentials.txt

echo ""
echo "=== MinIO setup complete ==="
echo "Credentials saved to /root/minio-credentials.txt"
echo ""
cat /root/minio-credentials.txt

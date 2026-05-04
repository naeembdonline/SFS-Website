#!/bin/bash
# ===================================================================
# PostgreSQL Setup Script
# ===================================================================

set -e

# Configure these before running
DB_NAME="sfs_db"
DB_USER="sfs_user"
DB_PASS=$(openssl rand -base64 24)

echo "=== Setting up PostgreSQL ==="

systemctl enable postgresql
systemctl start postgresql

sudo -u postgres psql <<EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASS}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
EOF

# Tune PostgreSQL for production (basic)
PG_VERSION=$(ls /etc/postgresql/)
PG_CONF="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"

cat >> $PG_CONF <<EOF

# === Production Tuning ===
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
random_page_cost = 1.1
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
EOF

systemctl restart postgresql

# Save credentials
cat > /root/postgres-credentials.txt <<EOF
Database: ${DB_NAME}
Username: ${DB_USER}
Password: ${DB_PASS}
Connection URL: postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}
EOF

chmod 600 /root/postgres-credentials.txt

echo ""
echo "=== PostgreSQL setup complete ==="
echo "Credentials saved to /root/postgres-credentials.txt"
echo ""
cat /root/postgres-credentials.txt

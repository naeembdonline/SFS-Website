#!/bin/bash
# ===================================================================
# Redis Security Hardening
# - Password protection
# - Localhost binding
# - Memory limit
# - Persistence
# ===================================================================

set -e

REDIS_PASS=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
REDIS_CONF="/etc/redis/redis.conf"

cp ${REDIS_CONF} ${REDIS_CONF}.bak

# Apply security settings
sed -i "s/^# requirepass .*/requirepass ${REDIS_PASS}/" ${REDIS_CONF}
sed -i "s/^bind .*/bind 127.0.0.1 ::1/" ${REDIS_CONF}
sed -i "s/^protected-mode .*/protected-mode yes/" ${REDIS_CONF}

# Append hardening settings
cat >> ${REDIS_CONF} <<EOF

# === Security Hardening ===
maxmemory 256mb
maxmemory-policy allkeys-lru
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
rename-command DEBUG ""

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
EOF

systemctl restart redis-server
systemctl enable redis-server

# Save credentials
cat > /root/redis-credentials.txt <<EOF
Redis Password: ${REDIS_PASS}
Redis URL: redis://:${REDIS_PASS}@localhost:6379
EOF

chmod 600 /root/redis-credentials.txt

echo ""
echo "=== Redis hardened ==="
echo "Credentials: /root/redis-credentials.txt"
echo ""
echo "!!! Update .env.production with: !!!"
cat /root/redis-credentials.txt

# Test connection
redis-cli -a "${REDIS_PASS}" ping

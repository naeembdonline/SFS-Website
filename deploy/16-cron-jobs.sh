#!/bin/bash
# ===================================================================
# System Cron Jobs Setup
# Triggers app's /api/cron/* endpoints with bearer token
# ===================================================================

set -e

DOMAIN="${1:-}"
ENV_FILE="${2:-/home/deploy/sfs-app/.env.production}"

if [ -z "$DOMAIN" ]; then
  echo "Usage: ./16-cron-jobs.sh <domain> [env-file]"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found"
  exit 1
fi

# Read CRON_SECRET from env
CRON_SECRET=$(grep "^CRON_SECRET=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$CRON_SECRET" ]; then
  echo "ERROR: CRON_SECRET not set in $ENV_FILE"
  exit 1
fi

# Cron wrapper script
cat > /usr/local/bin/sfs-cron-call.sh <<EOF
#!/bin/bash
ENDPOINT="\$1"
URL="https://${DOMAIN}/api/cron/\${ENDPOINT}"
LOG="/var/log/sfs-cron.log"

RESPONSE=\$(curl -sS -m 60 \\
  -H "Authorization: Bearer ${CRON_SECRET}" \\
  -H "User-Agent: sfs-cron/1.0" \\
  -w "\nHTTP_CODE:%{http_code}" \\
  "\${URL}" 2>&1)

CODE=\$(echo "\$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=\$(echo "\$RESPONSE" | grep -v "HTTP_CODE:")

echo "[\$(date '+%Y-%m-%d %H:%M:%S')] \${ENDPOINT} → HTTP \${CODE} \${BODY}" >> "\$LOG"

if [ "\$CODE" != "200" ]; then
  exit 1
fi
EOF

chmod +x /usr/local/bin/sfs-cron-call.sh
chmod 700 /usr/local/bin/sfs-cron-call.sh  # only root can read CRON_SECRET

# Install crontab
CRON_TMP=$(mktemp)
crontab -l 2>/dev/null | grep -v "sfs-cron-call.sh" > "$CRON_TMP" || true

cat >> "$CRON_TMP" <<EOF

# === SFS App Cron Jobs ===
# Retention cleanup — daily at 3:30 AM
30 3 * * * /usr/local/bin/sfs-cron-call.sh retention
EOF

crontab "$CRON_TMP"
rm -f "$CRON_TMP"

# Logrotate for cron log
cat > /etc/logrotate.d/sfs-cron <<EOF
/var/log/sfs-cron.log {
  weekly
  rotate 8
  compress
  delaycompress
  missingok
  notifempty
  create 0640 root root
}
EOF

echo ""
echo "=== Cron jobs installed ==="
crontab -l | grep -A20 "SFS App Cron"
echo ""
echo "Logs: /var/log/sfs-cron.log"
echo "Test: /usr/local/bin/sfs-cron-call.sh retention"

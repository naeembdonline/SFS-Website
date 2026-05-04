#!/bin/bash
# ===================================================================
# Server Monitoring Setup
# - System metrics via netdata (free, lightweight)
# - Self-healing service watchdog
# ===================================================================

set -e

DOMAIN="${1:-}"

echo "=== Installing Netdata (real-time monitoring) ==="
bash <(curl -SsL https://my-netdata.io/kickstart.sh) --dont-wait --disable-telemetry

# Bind netdata to localhost only (proxy via nginx)
cat > /etc/netdata/netdata.conf <<EOF
[global]
    bind socket to IP = 127.0.0.1

[web]
    bind to = 127.0.0.1:19999
    allow connections from = localhost
EOF

systemctl restart netdata

if [ -n "$DOMAIN" ]; then
  echo "=== Adding monitoring subdomain to nginx ==="
  cat > /etc/nginx/sites-available/monitor <<EOF
server {
    listen 443 ssl http2;
    server_name monitor.${DOMAIN};

    auth_basic "Monitoring";
    auth_basic_user_file /etc/nginx/.htpasswd;

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:19999;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
EOF

  # Create htpasswd
  if [ ! -f /etc/nginx/.htpasswd ]; then
    apt install -y apache2-utils
    MONITOR_PASS=$(openssl rand -base64 16)
    htpasswd -bc /etc/nginx/.htpasswd admin "${MONITOR_PASS}"
    echo "Monitoring login: admin / ${MONITOR_PASS}" > /root/monitoring-credentials.txt
    chmod 600 /root/monitoring-credentials.txt
  fi

  ln -sf /etc/nginx/sites-available/monitor /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx

  certbot --nginx -d monitor.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN} --redirect || true
fi

echo "=== Setting up service watchdog ==="
cat > /usr/local/bin/sfs-watchdog.sh <<'WATCHDOG'
#!/bin/bash
# Auto-restart failed services
SERVICES=(postgresql minio redis-server nginx)
for svc in "${SERVICES[@]}"; do
  if ! systemctl is-active --quiet $svc; then
    echo "[$(date)] $svc down - restarting" >> /var/log/sfs-watchdog.log
    systemctl restart $svc
  fi
done

# Check Next.js app via PM2
if ! sudo -u deploy pm2 jlist | grep -q '"status":"online"'; then
  echo "[$(date)] sfs-app down - restarting" >> /var/log/sfs-watchdog.log
  sudo -u deploy pm2 restart sfs-app
fi

# Health check
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  echo "[$(date)] Health check failed (HTTP $HTTP_CODE) - restarting app" >> /var/log/sfs-watchdog.log
  sudo -u deploy pm2 restart sfs-app
fi
WATCHDOG

chmod +x /usr/local/bin/sfs-watchdog.sh

# Cron: every 2 minutes
(crontab -l 2>/dev/null; echo "*/2 * * * * /usr/local/bin/sfs-watchdog.sh") | crontab -

echo ""
echo "=== Monitoring setup complete ==="
echo ""
if [ -n "$DOMAIN" ]; then
  echo "Dashboard: https://monitor.${DOMAIN}"
  cat /root/monitoring-credentials.txt
fi
echo ""
echo "External uptime monitoring (recommended free options):"
echo "  - UptimeRobot:  https://uptimerobot.com  (50 monitors free, 5min interval)"
echo "  - BetterStack:  https://betterstack.com  (10 monitors free, 30s interval)"
echo "  - Healthchecks: https://healthchecks.io  (cron monitoring, 20 free)"
echo ""
echo "Add monitor for: https://${DOMAIN:-yourdomain.com}/api/health"
echo "Expected response: 200 OK with {\"status\":\"ok\"}"

#!/bin/bash
# ===================================================================
# Nginx + SSL (Let's Encrypt) Setup Script
# ===================================================================

set -e

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: ./05-nginx-ssl.sh <domain> <email>"
  echo "Example: ./05-nginx-ssl.sh example.com admin@example.com"
  exit 1
fi

echo "=== Configuring Nginx for $DOMAIN ==="

cat > /etc/nginx/sites-available/sfs-app <<EOF
# Rate limiting
limit_req_zone \$binary_remote_addr zone=general:10m rate=30r/s;
limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;

# Upstream
upstream nextjs_app {
    server 127.0.0.1:3000;
    keepalive 64;
}

upstream minio_api {
    server 127.0.0.1:9000;
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN} cdn.${DOMAIN};
    return 301 https://\$host\$request_uri;
}

# Main app
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    client_max_body_size 50M;

    # Static assets
    location /_next/static/ {
        proxy_cache_valid 200 365d;
        expires 365d;
        add_header Cache-Control "public, immutable";
        proxy_pass http://nextjs_app;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Main app
    location / {
        limit_req zone=general burst=50 nodelay;
        proxy_pass http://nextjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

# CDN subdomain (MinIO public bucket)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name cdn.${DOMAIN};

    client_max_body_size 100M;

    location / {
        proxy_pass http://minio_api/public/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 300;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        chunked_transfer_encoding off;

        # Cache static media
        proxy_cache_valid 200 30d;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOF

ln -sf /etc/nginx/sites-available/sfs-app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

echo "=== Obtaining SSL certificates ==="
certbot --nginx \
  -d ${DOMAIN} \
  -d www.${DOMAIN} \
  -d cdn.${DOMAIN} \
  --non-interactive \
  --agree-tos \
  --email ${EMAIL} \
  --redirect

# Auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer

echo ""
echo "=== Nginx + SSL setup complete ==="
echo "Site: https://${DOMAIN}"
echo "CDN:  https://cdn.${DOMAIN}"

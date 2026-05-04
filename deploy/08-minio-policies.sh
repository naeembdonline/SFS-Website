#!/bin/bash
# ===================================================================
# MinIO CORS + Bucket Policies
# Browser uploads এবং public access এর জন্য
# ===================================================================

set -e

DOMAIN="${1:-}"

if [ -z "$DOMAIN" ]; then
  echo "Usage: ./08-minio-policies.sh <domain>"
  exit 1
fi

# Read MinIO credentials
source /etc/default/minio

mc alias set local http://localhost:9000 "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"

# === Public bucket policy: read-only public access ===
cat > /tmp/public-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::public/*"]
    }
  ]
}
EOF

mc anonymous set-json /tmp/public-policy.json local/public

# === CORS for browser uploads ===
cat > /tmp/cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://${DOMAIN}",
        "https://www.${DOMAIN}"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "x-amz-request-id"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

# Apply CORS to both buckets
mc admin config set local api cors_allow_origin="https://${DOMAIN},https://www.${DOMAIN}"
mc admin service restart local

sleep 3

# === Lifecycle: cleanup old uploads after 30 days for private bucket ===
cat > /tmp/lifecycle.json <<EOF
{
  "Rules": [
    {
      "ID": "expire-incomplete-uploads",
      "Status": "Enabled",
      "Filter": {},
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 7
      }
    }
  ]
}
EOF

mc ilm import local/private < /tmp/lifecycle.json
mc ilm import local/public < /tmp/lifecycle.json

# Cleanup
rm -f /tmp/public-policy.json /tmp/cors.json /tmp/lifecycle.json

echo ""
echo "=== MinIO policies applied ==="
echo "Public bucket: read-only public access"
echo "CORS: ${DOMAIN}, www.${DOMAIN}"
echo "Lifecycle: incomplete uploads expire after 7 days"

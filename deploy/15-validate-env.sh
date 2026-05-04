#!/bin/bash
# ===================================================================
# Pre-deploy Environment Validation
# Run BEFORE starting app to catch config issues
# ===================================================================

set -e

ENV_FILE="${1:-/home/deploy/sfs-app/.env.production}"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found"
  exit 1
fi

echo "=== Validating $ENV_FILE ==="
echo ""

# Required vars
REQUIRED=(
  DATABASE_URL
  AUTH_SECRET
  TOTP_ENCRYPTION_KEY
  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
  R2_BUCKET_PUBLIC
  R2_BUCKET_PRIVATE
  R2_PUBLIC_URL
  EMAIL_FROM
  EMAIL_STAFF_INBOX
  CRON_SECRET
  NEXT_PUBLIC_SITE_URL
)

ERRORS=0

# Source env file
set -a
source "$ENV_FILE"
set +a

# Check required
for var in "${REQUIRED[@]}"; do
  if [ -z "${!var}" ]; then
    echo "  ❌ Missing: $var"
    ERRORS=$((ERRORS + 1))
  fi
done

# Storage: at least one of these
if [ -z "$R2_ENDPOINT" ] && [ -z "$R2_ACCOUNT_ID" ]; then
  echo "  ❌ Need either R2_ENDPOINT (MinIO) or R2_ACCOUNT_ID (Cloudflare R2)"
  ERRORS=$((ERRORS + 1))
fi

# Email provider
PROVIDER="${EMAIL_PROVIDER:-$([ -n "$RESEND_API_KEY" ] && echo "resend" || echo "smtp")}"
if [ "$PROVIDER" = "resend" ] && [ -z "$RESEND_API_KEY" ]; then
  echo "  ❌ EMAIL_PROVIDER=resend but RESEND_API_KEY not set"
  ERRORS=$((ERRORS + 1))
fi
if [ "$PROVIDER" = "smtp" ] && [ -z "$SMTP_HOST" ]; then
  echo "  ❌ EMAIL_PROVIDER=smtp but SMTP_HOST not set"
  ERRORS=$((ERRORS + 1))
fi

# Secret strength
for var in AUTH_SECRET TOTP_ENCRYPTION_KEY CRON_SECRET; do
  val="${!var}"
  if [ -n "$val" ] && [ "${#val}" -lt 32 ]; then
    echo "  ⚠️  $var is too short (${#val} chars, need 32+)"
    ERRORS=$((ERRORS + 1))
  fi
done

# Bad placeholder values
for var in "${REQUIRED[@]}"; do
  val="${!var}"
  case "${val,,}" in
    "secret"|"password"|"changeme"|"default"|"test"|"dummy"|"yourpassword"*|"your_"*|*"_here")
      echo "  ⚠️  $var looks like a placeholder: $val"
      ERRORS=$((ERRORS + 1))
      ;;
  esac
done

# Connectivity tests
echo ""
echo "=== Connectivity tests ==="

# Database
if command -v psql &>/dev/null; then
  if psql "$DATABASE_URL" -c "SELECT 1" &>/dev/null; then
    echo "  ✅ Database reachable"
  else
    echo "  ❌ Cannot connect to database"
    ERRORS=$((ERRORS + 1))
  fi
fi

# R2/MinIO endpoint
ENDPOINT="${R2_ENDPOINT:-https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com}"
if curl -sf -o /dev/null -m 5 "$ENDPOINT/minio/health/live" 2>/dev/null || \
   curl -sf -o /dev/null -m 5 "$ENDPOINT" 2>/dev/null; then
  echo "  ✅ Storage endpoint reachable: $ENDPOINT"
else
  echo "  ⚠️  Storage endpoint not responding: $ENDPOINT (may still work)"
fi

# Redis
if [ -n "$REDIS_URL" ] && command -v redis-cli &>/dev/null; then
  if redis-cli -u "$REDIS_URL" ping &>/dev/null; then
    echo "  ✅ Redis reachable"
  else
    echo "  ❌ Cannot connect to Redis"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Public site URL format
if [[ ! "$NEXT_PUBLIC_SITE_URL" =~ ^https?:// ]]; then
  echo "  ❌ NEXT_PUBLIC_SITE_URL must start with http:// or https://"
  ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -gt 0 ]; then
  echo "❌ Validation FAILED with $ERRORS issue(s)"
  echo ""
  echo "Generate strong secrets:"
  echo "  openssl rand -hex 32"
  exit 1
else
  echo "✅ All environment checks passed"
fi

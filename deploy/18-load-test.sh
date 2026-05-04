#!/bin/bash
# ===================================================================
# Load Test Script (k6)
# Production traffic simulation
# ===================================================================

set -e

DOMAIN="${1:-}"
DURATION="${2:-30s}"
VUS="${3:-50}"

if [ -z "$DOMAIN" ]; then
  cat <<EOF
Usage: ./18-load-test.sh <domain> [duration] [virtual-users]

Examples:
  ./18-load-test.sh example.com           # default: 30s, 50 VUs
  ./18-load-test.sh example.com 2m 100    # 2 minutes, 100 VUs
EOF
  exit 1
fi

# Install k6 if not present
if ! command -v k6 &>/dev/null; then
  echo "=== Installing k6 ==="
  if [ "$EUID" -eq 0 ]; then
    gpg -k
    gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
    echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | tee /etc/apt/sources.list.d/k6.list
    apt update
    apt install -y k6
  else
    echo "Run as root to install k6, or install manually: https://k6.io/docs/get-started/installation/"
    exit 1
  fi
fi

# Generate test script
TEST_FILE=$(mktemp /tmp/k6-test-XXXXXX.js)
cat > "$TEST_FILE" <<EOF
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: ${VUS} },
    { duration: '${DURATION}', target: ${VUS} },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE = 'https://${DOMAIN}';
const PATHS = [
  '/',
  '/bn',
  '/en',
  '/bn/about',
  '/en/blog',
  '/bn/news',
  '/api/health',
];

export default function () {
  const path = PATHS[Math.floor(Math.random() * PATHS.length)];
  const res = http.get(\`\${BASE}\${path}\`, {
    headers: { 'User-Agent': 'k6-load-test' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'body present': (r) => r.body && r.body.length > 0,
    'response < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(Math.random() * 2);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  const m = data.metrics;
  return \`
═══════════════════════════════════════════════
   LOAD TEST RESULTS
═══════════════════════════════════════════════
Total requests:     \${m.http_reqs.values.count}
Failed:             \${(m.http_req_failed.values.rate * 100).toFixed(2)}%
Avg duration:       \${m.http_req_duration.values.avg.toFixed(0)}ms
P95 duration:       \${m.http_req_duration.values['p(95)'].toFixed(0)}ms
P99 duration:       \${m.http_req_duration.values['p(99)'].toFixed(0)}ms
Max duration:       \${m.http_req_duration.values.max.toFixed(0)}ms
RPS:                \${m.http_reqs.values.rate.toFixed(1)}

Pass: \${data.root_group.checks.filter(c => c.passes > 0).length}
Fail: \${data.root_group.checks.filter(c => c.fails > 0).length}
═══════════════════════════════════════════════
\`;
}
EOF

echo "=== Running load test against https://${DOMAIN} ==="
echo "Duration: ${DURATION}, VUs: ${VUS}"
echo ""

k6 run "$TEST_FILE"

rm -f "$TEST_FILE"

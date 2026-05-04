#!/bin/bash
# ===================================================================
# PM2 Log Rotation Setup
# Daily rotation, max 10MB per file, keep 14 days
# ===================================================================

set -e

pm2 install pm2-logrotate

pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
pm2 set pm2-logrotate:workerInterval 30

pm2 save

echo ""
echo "=== PM2 log rotation configured ==="
echo "Logs rotate daily at midnight"
echo "Max size: 10MB per file, retain 14 days, compressed"
pm2 conf pm2-logrotate

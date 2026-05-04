# VPS Deployment Guide — সম্পূর্ণ Self-Hosted

## যা যা আছে

| # | ফাইল | কাজ |
|---|------|-----|
| 00 | [00-swap-setup.sh](00-swap-setup.sh) | 4GB swap (build OOM প্রতিরোধ) |
| 01 | [01-initial-setup.sh](01-initial-setup.sh) | Node.js 20, Nginx, PostgreSQL, Redis, firewall |
| 02 | [02-postgres-setup.sh](02-postgres-setup.sh) | DB + user + production tuning |
| 03 | [03-minio-setup.sh](03-minio-setup.sh) | S3-compatible storage |
| 04 | [04-app-deploy.sh](04-app-deploy.sh) | App build + PM2 cluster |
| 05 | [05-nginx-ssl.sh](05-nginx-ssl.sh) | Reverse proxy + Let's Encrypt SSL |
| 06 | [06-postfix-email.sh](06-postfix-email.sh) | Self-hosted email + DKIM (optional) |
| 07 | [07-backup.sh](07-backup.sh) | Local daily backup |
| 08 | [08-minio-policies.sh](08-minio-policies.sh) | CORS + public bucket + lifecycle |
| 09 | [09-db-init.sh](09-db-init.sh) | Database migrations + seed |
| 10 | [10-redis-secure.sh](10-redis-secure.sh) | Redis password + memory limit |
| 11 | [11-pm2-logrotate.sh](11-pm2-logrotate.sh) | PM2 log rotation |
| 12 | [12-offsite-backup.sh](12-offsite-backup.sh) | Cloudflare R2 offsite backup |
| 13 | [13-monitoring.sh](13-monitoring.sh) | Netdata + watchdog + uptime |
|    | [deploy-all.sh](deploy-all.sh) | **Master script — সব এক কমান্ডে** |

## এক-কমান্ডে সম্পূর্ণ ডিপ্লয়

### প্রস্তুতি
1. **VPS**: Ubuntu 22.04/24.04, ≥2GB RAM (4GB recommended), ≥40GB disk
2. **ডোমেইন**: Cloudflare এ ম্যানেজ করো
3. **DNS রেকর্ড** (ডিপ্লয়ের আগে অ্যাড করো):
   ```
   A    yourdomain.com         → VPS_IP   (Proxy: ON)
   A    www.yourdomain.com     → VPS_IP   (Proxy: ON)
   A    cdn.yourdomain.com     → VPS_IP   (Proxy: ON)
   A    monitor.yourdomain.com → VPS_IP   (Proxy: OFF for SSL)
   ```
4. **DNS propagation** এর জন্য ৫-১০ মিনিট অপেক্ষা করো

### ডিপ্লয়
```bash
ssh root@your-vps-ip
git clone <your-repo-url> /tmp/sfs-app
cd /tmp/sfs-app/deploy
chmod +x *.sh
./deploy-all.sh yourdomain.com admin@yourdomain.com https://github.com/your/repo.git
```

৫-১০ মিনিট পর সব রেডি!

## ডিপ্লয়ের পরের কাজ

### ১. Cloudflare R2 ব্যাকআপ (ফ্রি ১০GB)
```bash
nano /etc/sfs-backup.env
# R2 credentials দাও (Cloudflare dashboard > R2 > Manage API Tokens)
```

### ২. External Uptime Monitor
- [UptimeRobot](https://uptimerobot.com) (50 monitors free)
- Add: `https://yourdomain.com/api/health`
- Alert: Email/Slack/Discord

### ৩. Self-hosted Email (optional)
```bash
sudo ./06-postfix-email.sh yourdomain.com
# স্ক্রিপ্ট থেকে DNS records (SPF, DKIM, DMARC) Cloudflare এ অ্যাড করো
```

বিকল্প: [Resend](https://resend.com) free tier (3000 emails/month) — `.env.production` এ:
```
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com
```

## পরিচালনা

### App
```bash
pm2 status                           # স্ট্যাটাস
pm2 logs sfs-app                     # লগ
pm2 restart sfs-app                  # রিস্টার্ট
pm2 reload sfs-app                   # zero-downtime reload
```

### আপডেট ডিপ্লয়
```bash
sudo -u deploy bash -c "cd /home/deploy/sfs-app && git pull && npm ci && npm run build && pm2 reload sfs-app"
```

### Database
```bash
# Backup
sudo /home/deploy/sfs-app/deploy/07-backup.sh

# Restore
gunzip < /var/backups/sfs/postgres/sfs_db-DATE.sql.gz | sudo -u postgres psql sfs_db

# Console
sudo -u postgres psql sfs_db
```

### Service status
```bash
systemctl status nginx postgresql minio redis-server netdata
```

## সিকিউরিটি চেকলিস্ট

- [x] Firewall (UFW) — শুধু 22, 80, 443
- [x] Fail2ban
- [x] PostgreSQL localhost-only
- [x] Redis password + localhost-only
- [x] MinIO localhost API (proxied via cdn subdomain)
- [x] HTTPS everywhere
- [x] Security headers (HSTS, X-Frame-Options, etc.)
- [x] Rate limiting (Nginx)
- [x] Auto SSL renewal
- [x] Daily local + offsite backups
- [x] Service watchdog (auto-restart)
- [x] Health check endpoint
- [ ] **TODO**: SSH key-only auth — `PasswordAuthentication no` in `/etc/ssh/sshd_config`
- [ ] **TODO**: Disable root SSH — `PermitRootLogin no`
- [ ] **TODO**: 2FA for admin login (in app)

## খরচ

| সার্ভিস | খরচ |
|---------|-----|
| Hetzner CX22 (4GB RAM) | €4.51/mo (~$5) |
| Domain | $10-15/year |
| Cloudflare DNS+CDN+R2 | Free |
| **মোট** | **~$5-6/month** |

## Troubleshooting

| সমস্যা | সমাধান |
|--------|--------|
| Build OOM | `./00-swap-setup.sh 8G` |
| Database connection | `systemctl status postgresql` + check `.env.production` |
| 502 Bad Gateway | `pm2 logs sfs-app` — app crashed |
| MinIO 403 | `./08-minio-policies.sh yourdomain.com` |
| SSL renew fail | `certbot renew --dry-run` |
| Disk full | `du -sh /var/backups /var/log /data/minio` |

## পোর্ট ম্যাপ

| পোর্ট | সার্ভিস | Public? |
|------|---------|---------|
| 22 | SSH | ✅ |
| 80 | HTTP → 443 | ✅ |
| 443 | HTTPS | ✅ |
| 3000 | Next.js | ❌ (internal) |
| 5432 | PostgreSQL | ❌ |
| 6379 | Redis | ❌ |
| 9000 | MinIO API | ❌ (via cdn.) |
| 9001 | MinIO Console | ✅ (firewall, restrict IP) |
| 19999 | Netdata | ❌ (via monitor.) |
| 25 | SMTP | ❌ (outgoing only) |

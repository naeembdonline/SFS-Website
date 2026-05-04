#!/bin/bash
# ===================================================================
# Postfix Email Server Setup (self-hosted email)
# ===================================================================

set -e

DOMAIN="${1:-}"

if [ -z "$DOMAIN" ]; then
  echo "Usage: ./06-postfix-email.sh <domain>"
  exit 1
fi

echo "=== Installing Postfix ==="
DEBIAN_FRONTEND=noninteractive apt install -y postfix mailutils opendkim opendkim-tools

# Backup original config
cp /etc/postfix/main.cf /etc/postfix/main.cf.bak

# Configure Postfix
cat > /etc/postfix/main.cf <<EOF
smtpd_banner = \$myhostname ESMTP \$mail_name
biff = no
append_dot_mydomain = no
readme_directory = no
compatibility_level = 2

# TLS
smtpd_tls_cert_file=/etc/letsencrypt/live/${DOMAIN}/fullchain.pem
smtpd_tls_key_file=/etc/letsencrypt/live/${DOMAIN}/privkey.pem
smtpd_use_tls=yes
smtpd_tls_security_level=may
smtp_tls_security_level=may

# Identity
myhostname = mail.${DOMAIN}
mydomain = ${DOMAIN}
myorigin = \$mydomain
mydestination = \$myhostname, localhost.\$mydomain, localhost, \$mydomain
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128
inet_interfaces = loopback-only
inet_protocols = ipv4

# Restrictions
smtpd_relay_restrictions = permit_mynetworks permit_sasl_authenticated defer_unauth_destination
smtpd_recipient_restrictions = permit_mynetworks permit_sasl_authenticated reject_unauth_destination

# DKIM
milter_default_action = accept
milter_protocol = 6
smtpd_milters = local:opendkim/opendkim.sock
non_smtpd_milters = \$smtpd_milters

mailbox_size_limit = 0
recipient_delimiter = +
EOF

# Setup OpenDKIM
mkdir -p /etc/opendkim/keys/${DOMAIN}
cd /etc/opendkim/keys/${DOMAIN}
opendkim-genkey -s mail -d ${DOMAIN}
chown opendkim:opendkim mail.private

cat > /etc/opendkim.conf <<EOF
Syslog yes
UMask 002
Domain ${DOMAIN}
KeyFile /etc/opendkim/keys/${DOMAIN}/mail.private
Selector mail
Socket local:/var/spool/postfix/opendkim/opendkim.sock
PidFile /var/run/opendkim/opendkim.pid
OversignHeaders From
EOF

mkdir -p /var/spool/postfix/opendkim
chown opendkim:postfix /var/spool/postfix/opendkim
usermod -aG opendkim postfix

systemctl restart opendkim postfix
systemctl enable opendkim postfix

# Show DNS records to add
echo ""
echo "=== Postfix setup complete ==="
echo ""
echo "!!! IMPORTANT: Add these DNS records to Cloudflare !!!"
echo ""
echo "1. SPF Record:"
echo "   Type: TXT"
echo "   Name: @"
echo "   Value: v=spf1 ip4:YOUR_VPS_IP ~all"
echo ""
echo "2. DKIM Record:"
echo "   Type: TXT"
echo "   Name: mail._domainkey"
echo "   Value:"
cat /etc/opendkim/keys/${DOMAIN}/mail.txt
echo ""
echo "3. DMARC Record:"
echo "   Type: TXT"
echo "   Name: _dmarc"
echo "   Value: v=DMARC1; p=none; rua=mailto:admin@${DOMAIN}"
echo ""
echo "4. MX Record:"
echo "   Type: MX"
echo "   Name: @"
echo "   Value: mail.${DOMAIN} (priority 10)"
echo ""
echo "Test: echo 'test' | mail -s 'Test' your@email.com"

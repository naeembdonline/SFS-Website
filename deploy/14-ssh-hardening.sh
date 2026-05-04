#!/bin/bash
# ===================================================================
# SSH Hardening
# - Disable password authentication (key-only)
# - Disable root login
# - Change default port (optional)
# - Limit login attempts
# - Setup SSH key for deploy user if not present
# ===================================================================

set -e

SSH_PORT="${1:-22}"
PUBKEY="${2:-}"

if [ "$EUID" -ne 0 ]; then
  echo "ERROR: Run as root"
  exit 1
fi

if [ -z "$PUBKEY" ] && [ ! -f /root/.ssh/authorized_keys ]; then
  cat <<EOF
ERROR: No SSH public key found at /root/.ssh/authorized_keys
       AND no key passed as argument.

Usage:
  ./14-ssh-hardening.sh <port> "<ssh-public-key>"

Example:
  ./14-ssh-hardening.sh 22 "ssh-ed25519 AAAA... user@host"

OR add your key first:
  mkdir -p /root/.ssh
  echo 'YOUR_PUBLIC_KEY' >> /root/.ssh/authorized_keys
  chmod 700 /root/.ssh
  chmod 600 /root/.ssh/authorized_keys

DO NOT run this without verifying you can log in via key first!
EOF
  exit 1
fi

# Setup root key if provided
if [ -n "$PUBKEY" ]; then
  mkdir -p /root/.ssh
  echo "$PUBKEY" >> /root/.ssh/authorized_keys
  chmod 700 /root/.ssh
  chmod 600 /root/.ssh/authorized_keys
fi

# Setup deploy user key (copy from root)
if id deploy &>/dev/null; then
  mkdir -p /home/deploy/.ssh
  cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
  chown -R deploy:deploy /home/deploy/.ssh
  chmod 700 /home/deploy/.ssh
  chmod 600 /home/deploy/.ssh/authorized_keys
fi

echo "=== Backing up sshd_config ==="
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%s)

echo "=== Applying hardened SSH config ==="
cat > /etc/ssh/sshd_config <<EOF
# === Hardened SSH config ===
Port ${SSH_PORT}
Protocol 2

# Authentication
PermitRootLogin prohibit-password
PasswordAuthentication no
ChallengeResponseAuthentication no
UsePAM yes
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitEmptyPasswords no
MaxAuthTries 3
LoginGraceTime 30
MaxSessions 10
MaxStartups 10:30:60

# Limits
ClientAliveInterval 300
ClientAliveCountMax 2
TCPKeepAlive yes

# Disable unused features
X11Forwarding no
AllowAgentForwarding no
AllowTcpForwarding yes
GatewayPorts no
PermitTunnel no
PrintMotd no

# Restrict users
AllowUsers root deploy

# Logging
SyslogFacility AUTH
LogLevel VERBOSE

# Crypto
HostKey /etc/ssh/ssh_host_ed25519_key
HostKey /etc/ssh/ssh_host_rsa_key
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group-exchange-sha256
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com

Subsystem sftp /usr/lib/openssh/sftp-server

# Apply firewall changes
AcceptEnv LANG LC_*
EOF

# Update firewall if port changed
if [ "${SSH_PORT}" != "22" ]; then
  ufw allow ${SSH_PORT}/tcp
  ufw delete allow ssh 2>/dev/null || true
fi

# Configure fail2ban for SSH
cat > /etc/fail2ban/jail.d/sshd.conf <<EOF
[sshd]
enabled = true
port = ${SSH_PORT}
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF

systemctl restart fail2ban

# Test config before applying
echo "=== Testing SSH config ==="
sshd -t

echo "=== Restarting SSH ==="
systemctl restart ssh

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║         SSH HARDENED                       ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "Port:           ${SSH_PORT}"
echo "Password auth:  DISABLED"
echo "Root login:     key-only (prohibit-password)"
echo "Allowed users:  root, deploy"
echo "Fail2ban:       3 retries → 1 hour ban"
echo ""
echo "!!! IMPORTANT !!!"
echo "Test login from a NEW terminal BEFORE closing this one:"
echo "  ssh -p ${SSH_PORT} root@your-vps-ip"
echo "  ssh -p ${SSH_PORT} deploy@your-vps-ip"
echo ""
echo "যদি কাজ না করে, এই session থেকে restore করো:"
echo "  cp /etc/ssh/sshd_config.bak.* /etc/ssh/sshd_config"
echo "  systemctl restart ssh"

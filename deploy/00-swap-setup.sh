#!/bin/bash
# ===================================================================
# Swap File Setup
# 2GB RAM VPS এ Next.js build ফেইল করে - swap সেট করতে হবে
# ===================================================================

set -e

SWAP_SIZE="${1:-4G}"

if swapon --show | grep -q "/swapfile"; then
  echo "Swap already configured:"
  swapon --show
  exit 0
fi

echo "=== Creating ${SWAP_SIZE} swap file ==="
fallocate -l ${SWAP_SIZE} /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Persist on reboot
if ! grep -q "/swapfile" /etc/fstab; then
  echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

# Tune swappiness
sysctl vm.swappiness=10
sysctl vm.vfs_cache_pressure=50

cat > /etc/sysctl.d/99-swap.conf <<EOF
vm.swappiness=10
vm.vfs_cache_pressure=50
EOF

echo ""
echo "=== Swap setup complete ==="
free -h
swapon --show

#!/usr/bin/env bash
# Disable SSH password login. Run ONLY after confirming key login works for both root and deploy.
set -euo pipefail
cat > /etc/ssh/sshd_config.d/01-scholarsat.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
PubkeyAuthentication yes
EOF
sshd -t
systemctl reload ssh 2>/dev/null || systemctl reload sshd
echo "Password login disabled."

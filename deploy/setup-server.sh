#!/usr/bin/env bash
# One-time hardening + install for a fresh Ubuntu/Debian VPS. Run as root AFTER key login works:
#   ssh root@HOST 'bash -s' < deploy/setup-server.sh
# Idempotent: safe to re-run. Does not reinstall the OS or touch existing data.
set -euo pipefail
DEPLOY_USER=deploy
REPO=${REPO:-https://github.com/Codestarters-Foundation/scholarsat.git}

export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -yq
apt-get install -yq ca-certificates curl git ufw fail2ban unattended-upgrades

# --- deploy user with the same authorized keys as root ---
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
usermod -aG sudo "$DEPLOY_USER"
echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/90-$DEPLOY_USER && chmod 440 /etc/sudoers.d/90-$DEPLOY_USER
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /home/$DEPLOY_USER/.ssh
install -m 600 -o "$DEPLOY_USER" -g "$DEPLOY_USER" /root/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/authorized_keys

# --- firewall: only SSH, HTTP, HTTPS ---
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

# --- fail2ban for sshd ---
cat > /etc/fail2ban/jail.d/sshd.local <<'EOF'
[sshd]
enabled = true
maxretry = 5
findtime = 10m
bantime = 1h
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

# --- automatic security updates ---
dpkg-reconfigure -f noninteractive unattended-upgrades

# --- Docker Engine + Compose plugin (official repo) ---
if ! command -v docker >/dev/null; then
  . /etc/os-release
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/${ID}/gpg" -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/${ID} ${VERSION_CODENAME} stable" > /etc/apt/sources.list.d/docker.list
  apt-get update -q
  apt-get install -yq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker
usermod -aG docker "$DEPLOY_USER"
# Docker publishes ports by editing iptables directly; only 80/443 are published by our compose file.

# --- app checkout ---
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" /opt/scholarsat
if [ ! -d /opt/scholarsat/.git ]; then
  sudo -u "$DEPLOY_USER" git clone "$REPO" /opt/scholarsat
fi
echo "Setup complete. Next: create /opt/scholarsat/.env, then run deploy/deploy.sh as $DEPLOY_USER."

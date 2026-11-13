#!/usr/bin/env bash
# Redeploy on the server: pull the latest code, rebuild, restart. Run as the deploy user from /opt/scholarsat.
set -euo pipefail
cd "$(dirname "$0")/.."
git fetch --quiet origin main
git reset --hard origin/main
docker compose build app
docker compose up -d --remove-orphans
docker image prune -f >/dev/null
for i in $(seq 1 30); do
  if docker compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
    echo "Deployed $(git rev-parse --short HEAD) — healthy"; exit 0
  fi
  sleep 2
done
echo "Health check failed"; docker compose logs --tail=50 app; exit 1

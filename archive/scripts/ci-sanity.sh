#!/usr/bin/env bash

set -euo pipefail

echo "[INFO] CI sanity checks"

if ! command -v docker >/dev/null 2>&1; then
    echo "[ERROR] docker command not found"
    exit 1
fi

echo "[CHECK] Docker Compose config"
docker compose config -q

echo "[CHECK] Bash syntax in archive/scripts"
while IFS= read -r -d '' script; do
    bash -n "$script"
done < <(find archive/scripts -type f -name '*.sh' -print0)

echo "[CHECK] Critical secret patterns in tracked files"
critical_pattern='-----BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY-----|AKIA[0-9A-Z]{16}'
if git ls-files | xargs grep -nE "$critical_pattern" >/tmp/ci_critical_hits.txt 2>/dev/null; then
    echo "[ERROR] Potential critical secrets found:"
    cat /tmp/ci_critical_hits.txt
    exit 1
fi

echo "[CHECK] Placeholder secrets (warning only)"
if grep -nE 'JWT_SECRET: tu_secreto|MYSQL_ROOT_PASSWORD: rootpass123|MYSQL_PASSWORD: tienda_pass123|strapi_pass' docker-compose.yml >/tmp/ci_placeholder_hits.txt 2>/dev/null; then
    while IFS= read -r line; do
        echo "::warning::$line"
    done </tmp/ci_placeholder_hits.txt
fi

echo "[OK] CI sanity checks passed"

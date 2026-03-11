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

echo "[CHECK] Secretos hardcodeados en docker-compose.yml (deben estar como variables)"
if grep -nE ':\s+(rootpass|tienda_pass|strapi_pass|tu_secreto)' docker-compose.yml >/tmp/ci_hardcoded_hits.txt 2>/dev/null; then
    echo "[ERROR] Secretos hardcodeados detectados en docker-compose.yml:"
    cat /tmp/ci_hardcoded_hits.txt
    echo "[ERROR] Mueve los secretos a .env y referéncialos con \${VAR_NAME}"
    exit 1
fi

echo "[CHECK] Archivo .env.example presente en el repositorio"
if [ ! -f ".env.example" ]; then
    echo "[ERROR] Falta .env.example en la raíz del proyecto"
    exit 1
fi

echo "[OK] CI sanity checks passed"

#!/usr/bin/env bash
# tests/run.sh — Ejecuta todos los tests de integración contra el stack en ejecución
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000}"
TESTS_DIR="$(cd "$(dirname "$0")" && pwd)"
PASS=0; FAIL=0; ERRORS=()

# ── Colores ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; RESET='\033[0m'

# ── Esperar al gateway ─────────────────────────────────────────────────────────
echo -e "${YELLOW}[tests/run.sh] Esperando gateway en ${BASE_URL}/health...${RESET}"
for i in $(seq 1 30); do
    if curl -fsS "${BASE_URL}/health" >/dev/null 2>&1; then
        echo -e "${GREEN}Gateway listo.${RESET}"
        break
    fi
    [[ $i -eq 30 ]] && { echo -e "${RED}Gateway no disponible tras 60s. Abortando.${RESET}"; exit 1; }
    sleep 2
done

# ── Ejecutar tests ─────────────────────────────────────────────────────────────
for test_file in "$TESTS_DIR"/*.test.js; do
    name="$(basename "$test_file")"
    echo -e "\n${YELLOW}▶  ${name}${RESET}"
    if BASE_URL="${BASE_URL}" node --test --test-reporter=spec "$test_file" 2>&1; then
        echo -e "${GREEN}✔  ${name} passed${RESET}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}✖  ${name} FAILED${RESET}"
        FAIL=$((FAIL + 1))
        ERRORS+=("$name")
    fi
done

# ── Resumen ────────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
echo -e "  Tests: ${GREEN}${PASS} passed${RESET}  ${RED}${FAIL} failed${RESET}"
if [[ ${#ERRORS[@]} -gt 0 ]]; then
    echo -e "  ${RED}Fallaron:${RESET}"
    for e in "${ERRORS[@]}"; do echo "    - $e"; done
fi
echo "══════════════════════════════════════════"

[[ $FAIL -eq 0 ]]

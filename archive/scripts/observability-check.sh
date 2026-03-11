#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000}"

log() { echo "[obs-check] $*"; }

log "Esperando gateway en $BASE_URL/health"
for i in $(seq 1 30); do
  if curl -fsS "$BASE_URL/health" >/dev/null 2>&1; then
    break
  fi
  if [[ "$i" -eq 30 ]]; then
    echo "[obs-check][ERROR] gateway no disponible"
    exit 1
  fi
  sleep 2
done

log "Gateway health"
curl -fsS "$BASE_URL/health" | python3 -m json.tool

log "Gateway deep health"
curl -fsS "$BASE_URL/health/deep" | python3 -m json.tool

log "Gateway metrics (json snapshot)"
curl -fsS "$BASE_URL/metrics" | python3 -c "import json,sys; m=json.load(sys.stdin); print(json.dumps({'service': m.get('service'),'requests_total': m.get('requests_total'),'errors_total': m.get('errors_total'),'latency_ms': m.get('latency_ms')}, indent=2))"

log "Gateway metrics (prometheus format preview)"
curl -fsS "$BASE_URL/metrics?format=prometheus" | head -n 20

log "request-id propagation check"
RID="obs-$(date +%s)-$RANDOM"
HDR=$(curl -sSI -H "x-request-id: $RID" "$BASE_URL/health" | tr -d '\r' | grep -i '^x-request-id:' || true)
if [[ -z "$HDR" ]]; then
  echo "[obs-check][ERROR] x-request-id no presente en respuesta"
  exit 1
fi

echo "$HDR"
log "OK"

#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5000/api}"
PASSWORD="${E2E_PASSWORD:-Prueba123!}"
NAME="${E2E_NAME:-Usuario E2E}"
EMAIL="${E2E_EMAIL:-e2e.$(date +%s)@tienda.local}"

require_cmd() {
    local cmd="$1"
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "[ERROR] Required command not found: $cmd"
        exit 1
    fi
}

status_line() {
    echo "$1" | awk -F: '/HTTP_STATUS/{print $2}'
}

body_only() {
    echo "$1" | sed '/HTTP_STATUS:/d'
}

json_field() {
    local json="$1"
    local expression="$2"
    node -e "const d=JSON.parse(process.argv[1]); const out=($expression); process.stdout.write(out===undefined||out===null?'':String(out));" "$json"
}

request() {
    local method="$1"
    local url="$2"
    local body="${3:-}"
    local auth="${4:-}"

    local args=( -sS -w "\nHTTP_STATUS:%{http_code}" -X "$method" "$url" )

    if [[ -n "$body" ]]; then
        args+=( -H "Content-Type: application/json" -d "$body" )
    fi

    if [[ -n "$auth" ]]; then
        args+=( -H "Authorization: Bearer $auth" )
    fi

    curl "${args[@]}"
}

wait_for_gateway() {
    local health_url="$1"
    local retries="${2:-60}"
    local sleep_seconds="${3:-2}"

    echo "[INFO] Waiting for gateway health at $health_url"
    for i in $(seq 1 "$retries"); do
        if curl -fsS "$health_url" >/dev/null 2>&1; then
            echo "[INFO] Gateway is ready"
            return 0
        fi
        echo "[INFO] Waiting for gateway... ($i/$retries)"
        sleep "$sleep_seconds"
    done

    echo "[ERROR] Gateway did not become ready in time"
    return 1
}

assert_status() {
    local step="$1"
    local response="$2"
    local expected="$3"
    local got
    got="$(status_line "$response")"

    echo "[STEP] $step -> HTTP $got"
    if [[ "$got" != "$expected" ]]; then
        echo "[ERROR] Unexpected status on $step. Expected $expected, got $got"
        echo "[DEBUG] Response body:"
        body_only "$response"
        exit 1
    fi
}

main() {
    require_cmd curl
    require_cmd node

    echo "[INFO] Running E2E smoke against $BASE_URL"
    gateway_root="${BASE_URL%/api}"
    wait_for_gateway "$gateway_root/health"

    register_payload="{\"nombre\":\"$NAME\",\"email\":\"$EMAIL\",\"contrasena\":\"$PASSWORD\"}"
    register_resp="$(request POST "$BASE_URL/auth/register" "$register_payload")"
    assert_status "register" "$register_resp" "201"

    login_payload="{\"email\":\"$EMAIL\",\"contrasena\":\"$PASSWORD\"}"
    login_resp="$(request POST "$BASE_URL/auth/login" "$login_payload")"
    assert_status "login" "$login_resp" "200"

    login_body="$(body_only "$login_resp")"
    token="$(json_field "$login_body" 'd.token')"
    if [[ -z "$token" ]]; then
        echo "[ERROR] Token missing in login response"
        exit 1
    fi

    productos_resp="$(request GET "$BASE_URL/productos?page=1&limit=5")"
    assert_status "productos" "$productos_resp" "200"

    productos_body="$(body_only "$productos_resp")"
    product_id="$(json_field "$productos_body" '(d.datos&&d.datos[0])?d.datos[0].id:""')"
    if [[ -z "$product_id" ]]; then
        echo "[ERROR] No products returned from catalog"
        exit 1
    fi

    detalle_resp="$(request GET "$BASE_URL/productos/$product_id")"
    assert_status "detalle" "$detalle_resp" "200"

    add_payload="{\"producto_id\":$product_id,\"cantidad\":1}"
    add_resp="$(request POST "$BASE_URL/carrito/agregar" "$add_payload" "$token")"
    assert_status "carrito_agregar" "$add_resp" "200"

    carrito_resp="$(request GET "$BASE_URL/carrito" "" "$token")"
    assert_status "carrito" "$carrito_resp" "200"

    pedido_resp="$(request POST "$BASE_URL/pedidos/crear" "" "$token")"
    assert_status "pedido_crear" "$pedido_resp" "201"

    pedido_body="$(body_only "$pedido_resp")"
    pedido_id="$(json_field "$pedido_body" 'd.pedido_id')"

    pedidos_resp="$(request GET "$BASE_URL/pedidos" "" "$token")"
    assert_status "pedidos" "$pedidos_resp" "200"

    echo "[OK] Smoke test passed"
    echo "[DATA] email=$EMAIL"
    echo "[DATA] product_id=$product_id"
    echo "[DATA] pedido_id=$pedido_id"
}

main "$@"

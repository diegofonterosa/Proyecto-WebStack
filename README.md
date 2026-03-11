# Proyecto WebStack

Proyecto e-commerce basado en microservicios con:

- `services/api-gateway` (Node.js + Express + SSR EJS)
- `services/auth-service` (PHP)
- `services/product-service` (PHP)
- `services/order-service` (PHP)
- `services/strapi-cms` (Strapi)
- MySQL compartido vía Docker Compose

## Estructura actual

La raiz fue simplificada para mantener una estructura clara:

```text
app/
k8s/
nginx/
services/
.dockerignore
.gitignore
docker-compose.yml
README.md
archive/
```

`archive/` contiene material legado/documentacion extra y assets movidos en limpieza segura (por ejemplo `archive/frontend` y `archive/database`).

## Arranque rapido

```bash
docker compose up --build
```

Servicios esperados:

- Frontend: `http://localhost:3000`
- API Gateway: `http://localhost:5000`
- Strapi Admin: `http://localhost:1337/admin`
- MySQL: `localhost:3306`

## Endpoints principales del gateway

- `GET /` renderiza `app/views/index.ejs`
- `GET /producto/:id` renderiza `app/views/product.ejs`
- `GET /login` renderiza `app/views/login.ejs`
- `GET /register` renderiza `app/views/register.ejs`
- `GET /carrito` renderiza `app/views/carrito.ejs`
- `GET /search?q=...` reutiliza `app/views/index.ejs` con resultados
- `GET /categoria?c=...` reutiliza `app/views/index.ejs` filtrado
- `GET /health`
- `GET /metrics`
- Proxy APIs:
  - `/api/auth/*` -> `auth-service`
  - `/api/productos/*` -> `product-service`
  - `/api/pedidos/*` -> `order-service`
  - `/api/carrito/*` -> `order-service`
  - `/api/cms/*` -> `strapi-cms`

Flujo de auth en vistas EJS:

- `login.ejs` envia credenciales a `POST /api/auth/login`
- `register.ejs` envia registro a `POST /api/auth/register`
- `product.ejs` agrega al carrito via `POST /api/carrito/agregar` (Bearer token)
- `carrito.ejs` consulta carrito en `GET /api/carrito` y checkout en `POST /api/pedidos/crear`

## Imagenes de productos

- Las rutas de BD (por ejemplo `/images/zapatos-azules.jpg`) deben existir dentro de `app/public/images`.
- Si no existe el archivo, las vistas EJS usan fallback automatico a `/images/placeholder.svg`.
- Puedes agregar imagenes reales en `app/public/images` usando los mismos nombres del seed SQL.

## Notas de rutas tras la limpieza

- Los microservicios viven en `services/` (ya no en `microservices/`).
- `docker-compose.yml` apunta al frontend y SQL inicial dentro de `archive/`:
  - `./archive/frontend`
  - `./archive/database/*`

## Comandos utiles

```bash
# estado
docker compose ps

# logs
docker compose logs -f api-gateway
docker compose logs -f product-service
docker compose logs -f strapi-cms

# validar compose
docker compose config -q

# apagar
docker compose down
```

## Smoke test E2E

Se incluye un smoke test automatizado para validar el flujo critico:

- Registro
- Login
- Catalogo y detalle de producto
- Agregar al carrito
- Crear pedido y listar pedidos

Ejecucion local:

```bash
chmod +x archive/scripts/e2e-smoke.sh
docker compose up -d mysql auth-service product-service order-service api-gateway
./archive/scripts/e2e-smoke.sh
```

Variables opcionales:

```bash
BASE_URL=http://localhost:5000/api \
E2E_EMAIL=tu_email@tienda.local \
E2E_PASSWORD=TuPass123! \
./archive/scripts/e2e-smoke.sh
```

## CI (GitHub Actions)

Workflow: `.github/workflows/e2e-smoke.yml`

Se ejecuta automaticamente en:

- `push` a `main`
- `pull_request` hacia `main`

Pasos del workflow:

- Job `quality-check`:
  - `docker compose config -q`
  - validacion de sintaxis Bash en `archive/scripts/*.sh`
  - deteccion de patrones criticos de secretos (fallo)
  - placeholders inseguros en `docker-compose.yml` como warning
- Levanta `mysql`, `auth-service`, `product-service`, `order-service`, `api-gateway`
- Espera health del gateway
- Ejecuta `archive/scripts/e2e-smoke.sh`
- Publica logs de contenedores si falla
- Detiene servicios al finalizar

## Desarrollo local sin Docker (opcional)

```bash
# gateway
cd services/api-gateway
npm install
npm run dev

# strapi
cd services/strapi-cms
npm install --legacy-peer-deps
npm run dev
```

Para frontend local Vite, usar `archive/frontend`.

## Documentacion adicional

La documentacion historica y extendida se conserva en `archive/`.

Guia visual recomendada para iteraciones UI:

- `archive/UI-STYLEGUIDE.md`


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


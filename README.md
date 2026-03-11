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
- `GET /health/deep`
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

## Pantallas Stitch (Sistema de Diseño)

19 pantallas UI profesionales integradas desde el sistema de diseño Stitch. Servidas como archivos estáticos HTML sin wrapper EJS.

### Rutas Storefront (4)

- `GET /storefront/home` - Homepage con hero section + grid de categorías
- `GET /storefront/catalog` - Catálogo de productos con overlay de imágenes
- `GET /storefront/cart` - Carrito de compras + resumen de pedido
- `GET /storefront/checkout` - Formulario de pago seguro

### Rutas Admin CMS (15)

**Dashboard & Overview**
- `GET /admin/dashboard` - Resumen general de KPIs

**Gestión de Productos**
- `GET /admin/products` - Tabla de productos (diseño extendido)
- `GET /admin/products/new` - Formulario crear nuevo producto
- `GET /admin/products/editor` - Interfaz editar producto
- `GET /admin/products/variants` - Gestión de variantes de producto

**Gestión de Pedidos & Clientes**
- `GET /admin/orders` - Tabla de pedidos (diseño extendido)
- `GET /admin/orders/table` - Vista alternativa de órdenes
- `GET /admin/customers` - CRM lista de clientes

**Recurso & Media**
- `GET /admin/media` - Librería de medios (grid extendido con previsualizaciones)
- `GET /admin/inventory/alerts` - Alertas de bajo stock

**Configuración & Negocios**
- `GET /admin/settings/store` - Configuración global de tienda
- `GET /admin/marketing` - Gestor de promociones y descuentos
- `GET /admin/users/roles` - Roles y permisos de usuario
- `GET /admin/ssl` - Dashboard de certificados SSL
- `GET /admin/reports/best-sellers` - Análisis de productos bestsellers

### Acceso Universa & Hub

- `GET /stitch/:slug` - Acceso dinámico a cualquier pantalla por slug (ej: `/stitch/home`, `/stitch/products-dashboard`)
- `GET /stitch` - Hub con lista completa de todas las pantallas

### Arquitectura Técnica

| Aspecto | Detalles |
|---------|----------|
| **Entrega** | Archivos estáticos HTML directos (sin rendering templating) |
| **Ubicación** | `/app/public/stitch-screens/` (19 archivos `.html`) |
| **Styling** | Tailwind CSS + Material Symbols icons (CDN Google Fonts) |
| **Imágenes** | Assets locales `/app/public/images/stitch/` (12 JPGs - sin CDN externo) |
| **Navegación** | Hardcoded `href` a rutas explícitas (0 placeholders dinámicos) |
| **Modo rendering** | La ruta `/stitch/:slug` llama directo a `sendStitchHtml(res, slug)` |

### Desarrollo & Debugging Local

Las pantallas Stitch se renderizan automáticamente sin lógica dinámica (contenido estático). Para desarrollo local:

```bash
# Acceder a cualquier pantalla
curl http://localhost:5000/storefront/home
curl http://localhost:5000/admin/dashboard

# Listar todas las pantallas disponibles
curl http://localhost:5000/stitch
```

**Notas para integración futura:**
- Data binding: Conectar producto editor/catálogo con endpoints `/api/productos`
- Mock responses: Para testing sin backend, usar datos inline en HTML
- Dark mode: Algunas pantallas (ej: `products-dashboard`) incluyen tema oscuro via Tailwind

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

# chequeo de observabilidad
bash archive/scripts/observability-check.sh

# apagar
docker compose down
```

## Observabilidad

- Logs estructurados JSON en gateway con: `request_id`, `status`, `duration_ms`, `user_id`.
- Propagacion de trazas por header `x-request-id` desde gateway a microservicios proxied.
- `GET /health/deep` valida dependencias internas (`auth`, `product`, `order`) y marca `strapi` como opcional.
- `GET /metrics` expone snapshot JSON de trafico/latencia.
- `GET /metrics?format=prometheus` expone metricas en texto para scraping.

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
  - deteccion de secretos hardcodeados en `docker-compose.yml` (fallo)
  - validacion de presencia de `.env.example`
- Levanta `mysql`, `auth-service`, `product-service`, `order-service`, `api-gateway`
- Espera health del gateway
- Ejecuta `archive/scripts/e2e-smoke.sh`
- Ejecuta tests de integracion en `tests/*.test.js` via `tests/run.sh`
- Publica logs de contenedores si falla
- Detiene servicios al finalizar

## Configuracion de produccion

### 1) Variables de entorno

- Crear `.env` a partir de `.env.example` para desarrollo local.
- En produccion, inyectar secretos desde el gestor de secretos de tu plataforma.
- Variables minimas requeridas:
  - `MYSQL_ROOT_PASSWORD`
  - `MYSQL_DATABASE`
  - `MYSQL_USER`
  - `MYSQL_PASSWORD`
  - `JWT_SECRET`
  - `STRAPI_DB_PASSWORD`
  - `STRAPI_ADMIN_JWT_SECRET`
  - `STRAPI_APP_KEYS`

Recomendacion:

```bash
# JWT y admin secret
openssl rand -hex 32

# APP_KEYS de Strapi (4 valores)
node -e "console.log([1,2,3,4].map(()=>require('crypto').randomBytes(16).toString('base64')).join(','))"
```

### 2) Seguridad minima antes de exponer a internet

- Ejecutar chequeos de seguridad locales:

```bash
bash archive/scripts/ci-sanity.sh
bash archive/scripts/security-check.sh
```

- Confirmar que no hay secretos hardcodeados en `docker-compose.yml`.
- Usar TLS/HTTPS en el reverse proxy de entrada (Nginx/Load Balancer).
- Limitar origenes CORS en entorno productivo.

### 3) Observabilidad operativa

- Health basico: `GET /health`
- Health profundo: `GET /health/deep`
- Metricas JSON: `GET /metrics`
- Metricas Prometheus: `GET /metrics?format=prometheus`

Chequeo rapido:

```bash
bash archive/scripts/observability-check.sh
```

## Runbook de operacion

### Arranque

```bash
docker compose up -d --build
docker compose ps
```

### Verificacion funcional

```bash
bash archive/scripts/e2e-smoke.sh
bash tests/run.sh
```

### Backup y restore

```bash
bash archive/scripts/backup.sh
bash archive/scripts/restore.sh
```

### Diagnostico rapido de incidentes

```bash
# estado general
docker compose ps

# logs de gateway y servicios
docker compose logs --tail=200 api-gateway
docker compose logs --tail=200 auth-service
docker compose logs --tail=200 product-service
docker compose logs --tail=200 order-service

# salud y metricas
curl -s http://localhost:5000/health | python3 -m json.tool
curl -s http://localhost:5000/health/deep | python3 -m json.tool
curl -s 'http://localhost:5000/metrics?format=prometheus' | head -n 20
```

## Criterios de entrega (DoD)

- [x] Flujo critico e-commerce validado (registro, login, carrito, pedido)
- [x] Pipeline CI con sanity checks y smoke test
- [x] Tests de integracion por dominio (`auth`, `products`, `orders`, `observability`)
- [x] Secretos movidos a variables de entorno (`.env`/`.env.example`)
- [x] Endpoint de observabilidad y trazabilidad por request id
- [x] README final con operacion, seguridad y runbook

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


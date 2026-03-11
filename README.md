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

- `GET /` redirige a `/storefront/home`
- `GET /catalogo` renderiza `app/views/index.ejs` (fallback SSR EJS)
- `GET /producto/:id` renderiza `app/views/product.ejs`
- `GET /login` renderiza `app/views/login.ejs`
- `GET /register` renderiza `app/views/register.ejs`
- `GET /carrito` renderiza `app/views/carrito.ejs` (flujo EJS legado)
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

- No hay rutas dinámicas `/stitch/*` en el gateway actual; se exponen rutas explícitas `/storefront/*` y `/admin/*`.

### Arquitectura Técnica

| Aspecto | Detalles |
|---------|----------|
| **Entrega** | Archivos estáticos HTML directos (sin rendering templating) |
| **Ubicación** | `/app/public/stitch-screens/` (19 archivos `.html`) |
| **Styling** | Tailwind CSS + Material Symbols icons (CDN Google Fonts) |
| **Imágenes** | Assets locales `/app/public/images/stitch/` (12 JPGs - sin CDN externo) |
| **Navegación** | Rutas explícitas + mejoras globales en `nav.js` (home, cart, login, CTAs) |
| **Modo rendering** | Rutas explícitas del gateway (`/storefront/*`, `/admin/*`) que llaman a `sendStitchHtml(res, slug)` |

### Integración Dinámica con API

Parte de las pantallas Stitch están **conectadas a APIs reales** sin necesidad de refresh manualmente:

#### Pantallas Integradas

**Storefront**
- `GET /storefront/catalog` - Carga grid de productos desde `GET /api/productos`
- `GET /storefront/cart` - Carga items desde `GET /api/carrito`, calcula tax/total automáticamente

**Admin**
- `GET /admin/products` - Tabla dinámica de productos con SKU, categoría, stock, estado
  - Estado real: "In Stock" (>20), "Low Stock" (5-20), "Out of Stock" (<5)

#### Utilidades de API (`api-utils.js`)

Archivo reutilizable: `/app/public/stitch-screens/api-utils.js` (8.3 KB)

**Funciones principales:**
```javascript
// Autenticación
getAuthToken()              // Obtener token de localStorage
setAuthToken(token)         // Guardar token JWT

// Fetch autenticado
apiCall(endpoint, options)  // Request con Bearer token automático

// Endpoints de productos
getProductos(page, limit)   // GET /api/productos con paginación
getProductoById(id)         // GET /api/productos/:id
searchProductos(q, cat)     // GET /api/productos/search
getCategorias()             // GET /api/categorias

// Endpoints de carrito
getCarrito()                // GET /api/carrito
agregarAlCarrito(id, qty)   // POST /api/carrito/agregar

// Rendering
renderProductosGrid()       // Genera HTML grid de 3 columnas
renderProductosTable()      // Genera tabla con acciones admin
escapeHtml()                // Prevención de XSS
```

**Seguridad:**
- Tokens JWT compatibles en `localStorage` (`token` y `auth_token`) e inyectados automáticamente
- Validación 401 → redirección a `/login` si token expira
- HTML escapado para prevenir XSS

**UX reciente:**
- Toasts no bloqueantes en catálogo y carrito (sin `alert()`)
- Carrito con actualización en caliente (sin recarga completa por item)
- Controles `+/-`, eliminar por ítem y prevención de doble clic mientras responde la API

### Desarrollo & Debugging Local

**Acceder a pantallas integradas:**
```bash
# Cargar catálogo de productos
curl http://localhost:5000/storefront/catalog

# Cargar tabla admin de productos
curl http://localhost:5000/admin/products

# Cargar carrito
curl http://localhost:5000/storefront/cart
```

**Testing dinámico:**
```bash
# Verificar API de productos funcionando
curl http://localhost:5000/api/productos

# Agregar al carrito (con token)
curl -X POST http://localhost:5000/api/carrito/agregar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"producto_id": 1, "cantidad": 1}'
```

**Notas para desarrollo:**
- Pantallas sin integración (ej: checkout, product-editor) aún contienen datos mock
- para agregar integración a más pantallas:
  1. Importar `api-utils.js` en el HTML
  2. Llamar funciones como `getProductos()`, `getCarrito()` en `DOMContentLoaded`
  3. Renderizar respuesta con `renderProductosGrid()` o custom HTML
- Fallback automático a `/images/placeholder.svg` si imagen no existe

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

## Mejoras Lighthouse (marzo 2026)

- SEO técnico base: `robots.txt` y `sitemap.xml` servidos desde `/app/public`.
- Metadatos SEO en pantallas principales Stitch: `description`, `canonical`, Open Graph y Twitter card.
- Seguridad HTTP en gateway: CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`.
- Estrategia de caché: estáticos con cache; HTML sin cache.
- Performance en catálogo: eliminación de fallback HTML estático masivo, render dinámico y `loading="lazy"` en imágenes.

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

## Despliegue recomendado (Netlify + Backend separado)

Arquitectura sugerida para este proyecto:

- Frontend Stitch estatico en Netlify.
- API Gateway + microservicios en Render/Railway/Fly.io (o VPS con Docker).
- Base de datos MySQL gestionada (o contenedor persistente en el proveedor backend).

### Flujo recomendado

1. Desplegar backend primero y obtener URL publica del gateway (ej: `https://api.tu-dominio.com`).
2. Configurar frontend para consumir esa URL publica (variables de entorno o config del gateway frontend).
3. Publicar frontend en Netlify apuntando al directorio estatico servido.
4. Configurar dominio final y HTTPS.

### Nota importante

- GitHub Pages y Netlify por si solos no ejecutan esta arquitectura de microservicios Docker completa.
- Si solo publicas frontend estatico sin backend, login/carrito/pedidos no funcionaran.

## Checklist post-deploy

### Funcional

- [ ] `GET /health` responde 200.
- [ ] Login y registro funcionan contra `/api/auth/*`.
- [ ] Catalogo carga productos reales (`/api/productos`).
- [ ] Carrito agrega/elimina/actualiza cantidades.
- [ ] Checkout crea pedido (`/api/pedidos/crear`).

### Seguridad

- [ ] Headers activos: CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.
- [ ] Solo variables de entorno para secretos (sin hardcode en repositorio).
- [ ] CORS restringido a dominios permitidos en produccion.

### SEO y performance

- [ ] `robots.txt` publicado.
- [ ] `sitemap.xml` publicado.
- [ ] `meta description`, canonical y Open Graph en home/catalog.
- [ ] Lighthouse objetivo inicial: Performance >= 80, Accesibilidad >= 95, Best Practices >= 90, SEO >= 85.

### Observabilidad

- [ ] `GET /health/deep` operativo.
- [ ] `GET /metrics` y `GET /metrics?format=prometheus` operativos.
- [ ] Logs de gateway con `x-request-id` y latencia por request.

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


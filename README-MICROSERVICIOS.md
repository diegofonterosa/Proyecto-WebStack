# 🏗️ Arquitectura de Microservicios - Tienda Online Reactiva

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Microservicios](#microservicios)
4. [Tecnologías](#tecnologías)
5. [Instalación y Despliegue](#instalación-y-despliegue)
6. [API Endpoints](#api-endpoints)
7. [Flujos de Datos](#flujos-de-datos)

## 📖 Descripción General

Transformation de una aplicación monolítica tradicional a una **arquitectura de microservicios moderna** con:

- ✅ **API Gateway** centralizado para orquestación
- ✅ **Servicios independientes** desacoplados por dominio
- ✅ **Frontend reactivo** con React 18 + Vite
- ✅ **Orquestación con Docker Compose** para desarrollo local
- ✅ **Base de datos compartida** MySQL (escalable a bases de datos por servicio)
- ✅ **Comunicación síncrona** vía HTTP/REST
- ✅ **Autenticación centralizada** con JWT

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend React (Port 3000)                 │
│                   (Vite Dev Server + Components)                │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP/CORS
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway (Port 5000)                      │
│                      (Express.js Proxy)                         │
│         ┌──────────────────────────────────────────┐            │
│         │  JWT Verification Middleware            │            │
│         │  Request Routing                        │            │
│         │  CORS Configuration                     │            │
│         └──────────────────────────────────────────┘            │
└──────────┬──────────────┬──────────────────┬────────────────────┘
           │              │                  │
    HTTP   │              │ HTTP             │ HTTP
           ▼              ▼                  ▼
    ┌────────────────┐┌────────────────┐┌────────────────┐
    │ Auth Service   ││ Product Service││ Order Service  │
    │  (Port 5001)   ││  (Port 5002)   ││  (Port 5003)   │
    │   │─Login      ││  │─Get Products││  │─Cart Mgmt  │
    │   │─Register   ││  │─Search      ││  │─Checkout   │
    │   │─Verify JWT ││  │─Categories  ││  │─Order Hist │
    │   │─Token Gen  ││  │            ││  │            │
    └────────────────┘└────────────────┘└────────────────┘
           │                 │                    │
           └─────────┬───────┴────────┬──────────┘
                     │(PDO Connection)│
                     ▼                ▼
            ┌──────────────────────────────┐
            │    MySQL Database (Port 3306) │
            │  ┌──────────────────────────┐ │
            │  │ Shared Tables:           │ │
            │  │ • usuarios               │ │
            │  │ • productos              │ │
            │  │ • categorias             │ │
            │  │ • carrito                │ │
            │  │ • pedidos                │ │
            │  │ • pedido_detalles        │ │
            │  │ • sesiones               │ │
            │  │ • auditoria              │ │
            │  └──────────────────────────┘ │
            └──────────────────────────────┘
```

## 🔧 Microservicios

### 1. **API Gateway** (`microservices/api-gateway/`)

**Responsabilidad:** Punto de entrada único, enrutamiento, autenticación centralizada

**Stack:** Node.js + Express.js

**Puerto:** 5000

**Características:**
- Proxy inverso hacia servicios
- Verificación de JWT
- CORS management
- Health checks
- Request logging
- Rate limiting (preparado para implementar)

**Rutas:**
```
/api/auth/*      → Auth Service (5001)
/api/productos/* → Product Service (5002)
/api/carrito/*   → Order Service (5003)
/api/pedidos/*   → Order Service (5003)
/health          → Health check
```

### 2. **Auth Service** (`microservices/auth-service/`)

**Responsabilidad:** Gestión de usuarios y tokens de autenticación

**Stack:** PHP 8.1 + PDO

**Puerto:** 5001

**Endpoints:**
```
POST   /api/login              - Iniciar sesión
POST   /api/register           - Crear cuenta
GET    /api/verify             - Verificar token JWT
POST   /api/logout             - Cerrar sesión (opcional)
```

**Features:**
- Hash bcrypt de contraseñas (costo 12)
- JWT tokens con expiración 24h
- Validación de email
- CORS cross-origin

### 3. **Product Service** (`microservices/product-service/`)

**Responsabilidad:** Catálogo de productos, búsqueda, categorías

**Stack:** PHP 8.1 + PDO

**Puerto:** 5002

**Endpoints:**
```
GET    /api/productos?page=1&limit=12  - Listar productos con paginación
GET    /api/productos/:id               - Obtener detalle de producto
GET    /api/productos/search?q=...      - Búsqueda fulltext
GET    /api/categorias                  - Listar categorías
```

**Features:**
- Búsqueda fulltext en nombre y descripción
- Paginación configurable (por defecto 12/página)
- Filtrado por categoría
- Índices optimizados en BD

### 4. **Order Service** (`microservices/order-service/`)

**Responsabilidad:** Gestión del carrito y pedidos

**Stack:** PHP 8.1 + PDO + Transactions

**Puerto:** 5003

**Endpoints:**
```
GET    /api/carrito/             - Obtener carrito del usuario
POST   /api/carrito/agregar      - Agregar producto (cantidad incremental)
DELETE /api/carrito/:producto_id - Eliminar producto del carrito
POST   /api/pedidos/crear        - Crear pedido
GET    /api/pedidos              - Historial de pedidos
GET    /api/pedidos/:id          - Detalle de pedido
```

**Features:**
- Gestión transaccional (ACID)
- Validación de stock antes de checkout
- Actualización automática de stock
- Historial completo de órdenes
- Detalles de línea de pedido

## 💻 Tecnologías

### Backend
- **API Gateway:** Node.js 18 + Express.js
- **Microservicios:** PHP 8.1 + PDO
- **Base de datos:** MySQL 8.0
- **Autenticación:** JWT (JSON Web Tokens)
- **Hashing:** bcrypt (cost=12)

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Router:** React Router v6
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Estilos:** CSS3 (custom, sin frameworks CSS)

### DevOps
- **Containerización:** Docker + Docker Compose
- **Networking:** Docker custom bridge network
- **Orquestación:** Docker Compose (local development)

## 🚀 Instalación y Despliegue

### Prerequisitos
- Docker >= 20.10
- Docker Compose >= 2.0
- Git

### Pasos de Instalación

1. **Clonar/descargar proyecto:**
```bash
cd /workspaces/Proyecto-WebStack
```

2. **Crear archivos .env en cada servicio (opcional):**
```bash
cp microservices/api-gateway/.env.example microservices/api-gateway/.env
cp microservices/auth-service/.env.example microservices/auth-service/.env
cp microservices/product-service/.env.example microservices/product-service/.env
cp microservices/order-service/.env.example microservices/order-service/.env
cp frontend/.env.example frontend/.env
```

3. **Construir e iniciar servicios:**
```bash
docker-compose up --build
```

4. **Esperar a que todos los servicios estén sanos:**
```bash
docker-compose ps
# Debe mostrar todos los servicios con status "Up"
```

5. **Acceder a la aplicación:**
```
- Frontend:       http://localhost:3000
- API Gateway:    http://localhost:5000/api
- Auth Service:   http://localhost:5001
- Product Service: http://localhost:5002
- Order Service:  http://localhost:5003
- MySQL:          localhost:3306
```

### Detener servicios:
```bash
docker-compose down
```

### Ver logs:
```bash
docker-compose logs -f [servicio]
# Ejemplo:
docker-compose logs -f api-gateway
docker-compose logs -f auth-service
```

## 🔌 API Endpoints

### Autenticación (Auth Service)

**Login**
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "contraseña": "password123"
}

Response:
{
  "success": true,
  "token": "eyJ0eXAi...",
  "usuario": {
    "id": 1,
    "nombre": "Juan",
    "email": "usuario@example.com"
  }
}
```

**Registro**
```javascript
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "contraseña": "password123"
}

Response:
{
  "success": true,
  "token": "eyJ0eXAi...",
  "usuario": { ... }
}
```

### Productos (Product Service)

**Listar Productos**
```javascript
GET /api/productos?page=1&limit=12

Response:
{
  "datos": [
    {
      "id": 1,
      "nombre": "Laptop",
      "descripcion": "...",
      "precio": 799.99,
      "stock": 50,
      "categoria": "Electrónica",
      "imagen_url": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 145,
    "pages": 13
  }
}
```

**Búsqueda**
```javascript
GET /api/productos/search?q=laptop&categoria=

Response: Mismo formato que listar
```

### Carrito y Pedidos (Order Service)

**Agregar al Carrito**
```javascript
POST /api/carrito/agregar
Authorization: Bearer {token}
Content-Type: application/json

{
  "producto_id": 1,
  "cantidad": 2
}

Response:
{
  "success": true,
  "mensaje": "Producto agregado al carrito"
}
```

**Crear Pedido**
```javascript
POST /api/pedidos/crear
Authorization: Bearer {token}

Response:
{
  "success": true,
  "pedido_id": 42,
  "total": 1599.98,
  "fecha": "2024-01-15T10:30:00Z"
}
```

## 🔄 Flujos de Datos

### 1. Flujo de Registro y Login

```
Usuario
   │
   ├─→ Frontend (React)
   │      │─ Formulario de registro/login
   │      │─ Axios POST a /api/auth/register|login
   │      │
   ├─→ API Gateway
   │      │─ Recibe petición
   │      │─ Enruta a http://auth-service:5001
   │      │
   ├─→ Auth Service
   │      │─ Hash bcrypt de contraseña
   │      │─ Inserta/verifica en DB
   │      │─ Genera JWT token
   │      │
   └─← Response con token → localStorage (Frontend)
```

### 2. Flujo de Visualización de Productos

```
Usuario → Frontend
   │
   ├─→ GET /api/productos?page=1
   │
   ├─→ API Gateway
   │      │─ Enruta a Product Service
   │      │
   ├─→ Product Service
   │      │─ Query SELECT con LIMIT/OFFSET
   │      │─ Retorna JSON con productos
   │      │
   └─← Response → Renderizado React con Grid
```

### 3. Flujo de Checkout

```
Usuario → Frontend (Carrito)
   │
   ├─→ POST /api/pedidos/crear
   │      (Con Authorization: Bearer {token})
   │
   ├─→ API Gateway
   │      │─ Verifica JWT token
   │      │─ Enruta a Order Service
   │      │
   ├─→ Order Service
   │      │─ Verifica stock disponible
   │      │─ Inicia transacción
   │      │ ├─ INSERT INTO pedidos
   │      │ ├─ INSERT INTO pedido_detalles
   │      │ ├─ UPDATE productos (stock--)
   │      │ └─ COMMIT
   │      │
   └─← Retorna pedido_id → Usuario confirma compra
```

## 🔐 Seguridad

### Implementado
- ✅ JWT token validation en API Gateway
- ✅ Bcrypt password hashing (salt rounds: 12)
- ✅ CORS cross-origin protection
- ✅ SQL prepared statements (prevención SQL injection)
- ✅ HTTPS ready (infraestructura preparada)

### Recomendaciones para Producción
- 🔒 Usar HTTPS/TLS en todos los endpoints
- 🔒 Implementar rate limiting en API Gateway
- 🔒 Usar env vars sensibles en secrets management (AWS Secrets Manager, HashiCorp Vault)
- 🔒 Implementar circuit breakers entre servicios
- 🔒 Logging y monitoreo centralizado (ELK stack)
- 🔒 JWT refresh tokens con corta expiración
- 🔒 Implementar versionado de API

## 📊 Monitoreo y Logs

### Ver logs en tiempo real
```bash
docker-compose logs -f api-gateway
docker-compose logs -f auth-service
docker-compose logs -f product-service
docker-compose logs -f order-service
docker-compose logs -f frontend
```

### Health checks
```bash
curl http://localhost:5000/health
```

## 📚 Estructura de Directorios

```
Proyecto-WebStack/
├── microservices/
│   ├── api-gateway/
│   │   ├── server.js
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── .env.example
│   ├── auth-service/
│   │   ├── src/index.php
│   │   ├── Dockerfile
│   │   └── .env.example
│   ├── product-service/
│   │   ├── src/index.php
│   │   ├── Dockerfile
│   │   └── .env.example
│   └── order-service/
│       ├── src/index.php
│       ├── Dockerfile
│       └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── api/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── .env.example
├── database/
│   ├── schema.sql
│   └── seed.sql
├── docker-compose.yml
└── README-MICROSERVICIOS.md
```

## 🚀 Próximas Mejoras

- [ ] Implementar message queue (RabbitMQ/Kafka) para operaciones asincrónicas
- [ ] Service mesh (Istio) para observabilidad avanzada
- [ ] Base de datos por servicio (Database per Service pattern)
- [ ] Event sourcing y CQRS
- [ ] Implementar circuit breaker pattern
- [ ] API versioning
- [ ] GraphQL layer
- [ ] Kubernetes deployment manifests
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Unit/Integration tests

---

**Creado para:** Proyecto de Administración de Sistemas
**Versión:** 1.0.0
**Último actualizado:** 2024

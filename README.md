# 🏗️ Proyecto WebStack - Microservicios con Strapi CMS

Aplicación e-commerce moderna basada en **arquitectura de microservicios** con **CMS headless Strapi**, **React 18 + Vite**, y preparada para **producción en Vercel + Railway + Strapi Cloud**.

## 🚀 Características

- ✅ **5 Microservicios** independientes y escalables
  - API Gateway (router central)
  - Auth Service (autenticación JWT)
  - Product Service (catálogo de productos)
  - Order Service (gestión de órdenes)
  - Strapi CMS (gestión de contenido)

- ✅ **Frontend Moderno**
  - React 18 + Vite (hot reload, bundling rápido)
  - Zustand (state management minimalista)
  - React Router v6 (SPA con rutas)
  - Axios (HTTP client)

- ✅ **Infraestructura Profesional**
  - Docker & Docker Compose (desarrollo y producción)
  - MySQL con inicialización automática
  - Monitoreo de salud (health checks)
  - Variables de entorno por stage

- ✅ **CMS Integrado**
  - Strapi 4.15.5 (headless CMS)
  - Panel admin intuitivo
  - REST API + GraphQL
  - Manejo de medios
  - Webhooks para sincronización

- ✅ **Deployment Documentado**
  - Vercel (frontend)
  - Railway (apis)
  - Strapi Cloud o Heroku (CMS)
  - AWS RDS (base de datos producción)
  - GitHub Actions CI/CD

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#-requisitos-previos)
2. [Inicio Rápido (5 min)](#-inicio-rápido-5-min)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Documentación Detallada](#-documentación-detallada)
5. [Comandos Útiles](#-comandos-útiles)
6. [Deployment](#-deployment)
7. [Troubleshooting](#-troubleshooting)

---

## 💻 Requisitos Previos

- **Docker & Docker Compose** (v20+)
  ```bash
  docker --version
  docker-compose --version
  ```

- **Node.js** (v18+) - si ejecutas sin Docker
  ```bash
  node --version
  ```

- **Git**
  ```bash
  git --version
  ```

---

## ⚡ Inicio Rápido (5 min)

### Opción 1: Con Docker (RECOMENDADO)

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/Proyecto-WebStack.git
cd Proyecto-WebStack

# 2. Iniciar todos los servicios
docker-compose up -d

# 3. Verificar que todo está running
docker-compose ps

# 4. Esperar ~30 segundos y acceder:
# Frontend:  http://localhost:3000
# Admin:     http://localhost:1337/admin (Strapi)
# APIs:      http://localhost:5000/api/v1/* (Gateway)

# 5. Ver logs
docker-compose logs -f
```

### Opción 2: Sin Docker (desarrollo local)

```bash
# Backend - API Gateway
cd microservices/api-gateway
npm install
npm start  # corre en puerto 5000

# Frontend (otra terminal)
cd frontend
npm install
npm run dev  # corre en puerto 3000

# Strapi (otra terminal)
cd microservices/strapi-cms
npm install --legacy-peer-deps
npm run dev  # corre en puerto 1337
```

**Nota:** Requiere MySQL corriendo localmente en puerto 3306

---

## 📁 Estructura del Proyecto

```
Proyecto-WebStack/
│
├── 📚 Documentación
│   ├── README.md                    # Este archivo
│   ├── STRAPI-QUICK-START.md        # Guía rápida para usar Strapi
│   ├── STRAPI-SETUP.md              # Configuración detallada de Strapi
│   ├── VERCEL-DEPLOYMENT.md         # Deployment a producción
│   └── API-REFERENCE.md             # Endpoints de APIs
│
├── 🏗️ Microservicios
│   ├── api-gateway/                 # Router central (Express + Axios)
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── package.json
│   │
│   ├── auth-service/                # Autenticación JWT (Express + bcrypt)
│   │   ├── routes/auth.js
│   │   ├── lib/
│   │   └── package.json
│   │
│   ├── product-service/             # Catálogo (Express + MySQL)
│   │   ├── routes/products.js
│   │   ├── controllers/
│   │   └── package.json
│   │
│   ├── order-service/               # Órdenes (Express + MySQL)
│   │   ├── routes/orders.js
│   │   ├── controllers/
│   │   └── package.json
│   │
│   └── strapi-cms/                  # CMS (Strapi 4 + MySQL)
│       ├── config/                  # Configuración de servidor y DB
│       ├── src/                     # Bootstrap y extensiones
│       ├── package.json
│       ├── Dockerfile
│       └── .env.example
│
├── 🎨 Frontend
│   ├── src/
│   │   ├── components/              # React components
│   │   ├── pages/                   # Rutas principales
│   │   ├── api/                     # Clientes HTTP (axios)
│   │   ├── stores/                  # Estado global (Zustand)
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── vite.config.js               # Configuración Vite
│   ├── package.json
│   └── Dockerfile
│
├── 🗄️ Base de Datos
│   ├── docker-compose.yml           # Orquestación de servicios
│   ├── 01-init.sql                  # Inicialización tienda_db
│   ├── 02-sample-data.sql           # Datos de ejemplo
│   └── 03-strapi-init.sql           # Inicialización strapi_db
│
└── 🐳 Docker
    └── docker-compose.yml           # Archivo principal (MySQL, todas las APIs, frontend, Strapi)
```

**Detalles por servicio:**

### API Gateway (Puerto 5000)
```
POST   /api/v1/auth/login           → auth-service
POST   /api/v1/auth/register        → auth-service
GET    /api/v1/products             → product-service
POST   /api/v1/orders               → order-service
POST   /api/v1/webhooks/products    ← Strapi (cuando cambia contenido)
```

### Auth Service (Puerto 5001)
```
POST   /register                     (crear usuario)
POST   /login                        (obtener JWT)
POST   /verify                       (validar token)
```

### Product Service (Puerto 5002)
```
GET    /                             (listar productos)
GET    /:id                          (obtener por ID)
POST   /                             (admin: crear)
PUT    /:id                          (admin: actualizar)
DELETE /:id                          (admin: eliminar)
```

### Order Service (Puerto 5003)
```
GET    /                             (mis órdenes)
GET    /:id                          (obtener orden)
POST   /                             (crear nueva orden)
PUT    /:id                          (actualizar estado)
DELETE /:id                          (cancelar orden)
```

### Strapi CMS (Puerto 1337)
```
Admin Panel:       http://localhost:1337/admin
REST API:          http://localhost:1337/api/*
GraphQL:           http://localhost:1337/graphql
```

### Frontend (Puerto 3000)
```
Home:              http://localhost:3000
Productos:         http://localhost:3000/productos
Carrito:           http://localhost:3000/carrito
Órdenes:           http://localhost:3000/ordenes
```

---

## 📚 Documentación Detallada

### 1. Guía Rápida de Strapi (5 min)
➜ [STRAPI-QUICK-START.md](STRAPI-QUICK-START.md)

Incluye:
- Cómo crear content types
- Crear contenido en admin
- Consumir API desde React
- Permisos públicos
- Troubleshooting básico

### 2. Setup Completo de Strapi
➜ [STRAPI-SETUP.md](STRAPI-SETUP.md)

Incluye:
- Arquitectura de Strapi
- Configuración detallada
- Integración frontend (full)
- REST API reference
- GraphQL patterns
- Webhooks
- Media management
- Producción

### 3. Deployment a Producción
➜ [VERCEL-DEPLOYMENT.md](VERCEL-DEPLOYMENT.md)

Incluye:
- 3 arquitecturas diferentes ($, $$, $$$)
- Deployment paso a paso
- Vercel + Railway
- AWS RDS setup
- CI/CD con GitHub Actions
- Monitoreo
- Timeline de 4 semanas
- Análisis de costos

### 4. Referencia de APIs
➜ [API-REFERENCE.md](API-REFERENCE.md)

Incluye:
- Todos los endpoints
- Parámetros y respuestas
- Ejemplos con curl
- Status codes
- Errores comunes

---

## 🛠️ Comandos Útiles

### Docker Compose

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver estado
docker-compose ps

# Ver logs de un servicio
docker-compose logs -f api-gateway
docker-compose logs -f strapi-cms
docker-compose logs -f frontend

# Ver logs todos los servicios
docker-compose logs -f

# Detener servicios
docker-compose down

# Reconstruir imágenes
docker-compose up -d --build

# Ver redes
docker network ls
docker network inspect proyecto-webstack_default

# Ver volúmenes
docker volume ls
docker volume inspect proyecto-webstack_mysql_data
```

### Base de Datos

```bash
# Acceder a MySQL
docker exec -it proyecto-webstack_mysql_1 mysql -u root -proot

# Dentro de MySQL:
SHOW DATABASES;
USE tienda_db;
DESCRIBE usuarios;
DESCRIBE productos;

# Reset de DB (cuidado, borra todo)
docker-compose down -v
docker-compose up -d
```

### Frontend

```bash
# Desarrollo con Vite
npm run dev       # Hot reload en http://localhost:3000

# Build para producción
npm run build

# Previsualizar build
npm run preview

# Lintear código
npm run lint

# Test (si está configurado)
npm run test
```

### Strapi

```bash
# Desarrollo local (sin Docker)
npm run dev

# Build
npm run build

# Start producción
npm start

# Crear plugin
npx strapi generate
```

### Microservicios (Backend)

```bash
# Instalar dependencias
npm install --legacy-peer-deps

# Desarrollo
npm run dev

# Producción
npm start

# Linting
npm run lint
```

---

## 🚀 Deployment

### Quick Start: Vercel + Railway + Strapi Cloud

1. **Frontend a Vercel** (5 min)
   ```bash
   npm i -g vercel
   vercel login
   cd frontend
   vercel
   ```
   → https://mi-app.vercel.app

2. **APIs a Railway** (10 min)
   ```bash
   # En Railway: nueva app de Docker
   # Conectar repo GitHub → auto-deploy
   ```
   → https://api.railway.app

3. **CMS a Strapi Cloud** (5 min)
   ```bash
   # En Strapi.io: crear proyecto
   # Conectar DB (MongoDB Atlas)
   # Deploy automático
   ```
   → https://cms.strapi.app

### Documentación Completa
➜ [VERCEL-DEPLOYMENT.md](VERCEL-DEPLOYMENT.md)

---

## 🔐 Variables de Entorno

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000
VITE_CMS_URL=http://localhost:1337
```

### API Gateway (.env)
```
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
AUTH_SERVICE_URL=http://auth-service:5001
PRODUCT_SERVICE_URL=http://product-service:5002
ORDER_SERVICE_URL=http://order-service:5003
CMS_URL=http://strapi-cms:1337
```

### Auth Service (.env)
```
PORT=5001
DATABASE_HOST=mysql
DATABASE_USER=root
DATABASE_PASSWORD=root
DATABASE_NAME=tienda_db
JWT_SECRET=tu_secret_muy_largo_aqui
```

### Strapi (.env)
```
DATABASE_HOST=mysql
DATABASE_NAME=strapi_db
DATABASE_USER=strapi_user
DATABASE_PASSWORD=strapi_pass
HOST=0.0.0.0
PORT=1337
ADMIN_JWT_SECRET=admin_secret_aqui
```

---

## 🐛 Troubleshooting

### "connection refused" en APIs

```bash
# Verificar que MySQL está running
docker-compose ps mysql

# Ver logs MySQL
docker-compose logs mysql

# El problema suele ser que MySQL tarda en inits
# Espera 30 segundos y reintenta
```

### Strapi no inicia

```bash
# Ver error detallado
docker-compose logs strapi-cms

# Común: database not ready
# Solución: docker-compose down -v && docker-compose up

# Puerto 1337 ocupado
docker lsof -i :1337
kill -9 <PID>
```

### Frontend no ve APIs

```bash
# Verificar VITE_API_URL
cat frontend/.env.local

# Verificar CORS en gateway
curl -H "Origin: http://localhost:3000" http://localhost:5000

# Cambiar en vite.config.js:
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
}
```

### Puerto ya en uso

```bash
# Listar quién usa el puerto
lsof -i :3000
lsof -i :5000
lsof -i :1337

# Matar proceso
kill -9 <PID>

# O cambiar puerto en docker-compose.yml
```

### Base de datos corrupta

```bash
# Nuclear option: reset completo
docker-compose down -v
rm -rf docker/mysql_data/*
docker-compose up -d mysql
# Esperar 20 segundos
docker-compose up -d
```

---

## 📊 Arquitectura

```
┌─────────────────┐
│     VERCEL      │
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │
         │ HTTPS
         │
┌────────▼──────────────────────────────┐
│         API GATEWAY (Nginx/Express)   │
│         (Railway, Heroku, etc)        │
└────────┬──────────────────────────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │          │          │          │
┌───▼───┐  ┌──▼──┐  ┌───▼──┐  ┌───▼────┐
│ Auth  │  │Prod │  │Order │  │ Strapi │
│Service│  │Serv │  │Serve │  │  CMS   │
└───┬───┘  └──┬──┘  └───┬──┘  └───┬────┘
    │         │         │         │
    └─────────┴─────────┴─────────┘
              │
         ┌────▼─────────┐
         │  MySQL/RDS   │
         │ (prod DB)    │
         └──────────────┘
```

---

## 📈 Próximos Pasos

- [ ] **Semana 1:** Setup local + primeros content types en Strapi
- [ ] **Semana 2:** Integración frontend ↔ Strapi
- [ ] **Semana 3:** Deploy frontend a Vercel
- [ ] **Semana 4:** Deploy APIs a Railway
- [ ] **Semana 5:** Deploy CMS a Strapi Cloud
- [ ] **Semana 6:** CI/CD GitHub Actions
- [ ] **Semana 7:** Monitoreo y alertas

---

## 🤝 Contribuir

1. Fork el repo
2. Crear rama: `git checkout -b feature/tu-feature`
3. Commit: `git commit -am 'Add feature'`
4. Push: `git push origin feature/tu-feature`
5. Pull Request

---

## 📝 Licencia

MIT - Libre para uso comercial

---

## 💬 Soporte

- 📖 Docs: [docs.strapi.io](https://docs.strapi.io)
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/tu-usuario/discussions)

---

## ✅ Checklist Inicial

- [ ] Docker y Docker Compose instalados
- [ ] Repo clonado
- [ ] Variables de entorno configuradas
- [ ] `docker-compose up -d` ejecutado
- [ ] Frontend accesible en http://localhost:3000
- [ ] Admin Strapi accesible en http://localhost:1337/admin
- [ ] Crear primer banner en Strapi
- [ ] Integrar en frontend
- [ ] Tests pasando

---

**¡Bienvenido a WebStack! 🚀 Ahora eres parte de una arquitectura moderna, escalable y lista para producción.**

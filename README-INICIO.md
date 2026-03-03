# 🏪 Tienda Online Reactiva - Microservicios (v2.0)

> **Arquitectura moderna de microservicios con React 18, Node.js, PHP y Docker Compose**

## ⚡ Inicio Rápido (60 segundos)

```bash
cd /workspaces/Proyecto-WebStack

# Opción 1: Script automático (recomendado)
./start.sh

# Opción 2: Docker Compose
docker-compose up --build

# Esperar a que inicie y acceder a:
# 🌐 http://localhost:3000
```

## 📖 Documentación

| 📄 Documento | 📝 Descripción |
|-------------|---------------|
| **[RESUMEN-PROYECTO.md](RESUMEN-PROYECTO.md)** | 👈 **EMPIEZA AQUÍ** - Visión general completa del proyecto |
| **[README-MICROSERVICIOS.md](README-MICROSERVICIOS.md)** | Arquitectura detallada de microservicios |
| **[API-REFERENCE.md](API-REFERENCE.md)** | Referencia completa de endpoints con ejemplos curl |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | Solución de problemas comunes |
| **[PRODUCTION-SETUP.md](PRODUCTION-SETUP.md)** | Configuración para producción escalable |

## 🎯 Características Principales

### ✅ Arquitectura Microservicios
- **API Gateway** (Node.js) - Orquestación central en puerto 5000
- **Auth Service** (PHP) - Autenticación con JWT en puerto 5001
- **Product Service** (PHP) - Catálogo de productos en puerto 5002
- **Order Service** (PHP) - Gestión de pedidos en puerto 5003
- **MySQL** - Base de datos compartida en puerto 3306

### ⚛️ Frontend Reactivo
- **React 18** con Vite
- **React Router** para SPA
- **Zustand** para state management
- **Axios** para requests HTTP
- Diseño **responsive** con CSS3

### 🔐 Seguridad
- Autenticación JWT
- Bcrypt password hashing
- SQL prepared statements
- CORS protection
- Authorization headers

### 🐳 DevOps
- **Docker Compose** para orquestación local
- Health checks automáticos
- Database migrations
- Network isolation

## 🚀 Servicios en Ejecución

Una vez iniciado con `./start.sh` o `docker-compose up`:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:3000 | Interfaz React |
| **API Gateway** | http://localhost:5000/api | Proxy hacia servicios |
| **Auth Service** | http://localhost:5001 | Login/Register |
| **Product Service** | http://localhost:5002 | Catálogo productos |
| **Order Service** | http://localhost:5003 | Carrito y órdenes |
| **MySQL** | localhost:3306 | Base de datos |

## 🔗 Flujos Principales

### 1. Registro e Inicio de Sesión
```
Frontend → API Gateway → Auth Service → MySQL
↓
Genera JWT Token → localStorage
```

### 2. Visualizar Productos
```
Frontend → API Gateway → Product Service → MySQL
↓
Retorna catálogo paginado
```

### 3. Compra (Checkout)
```
Frontend → API Gateway → Order Service → MySQL
↓
Transacción ACID: INSERT pedido, actualizar stock
```

## 📦 Estructura del Proyecto

```
Proyecto-WebStack/
├── microservices/           # 4 servicios independientes
│   ├── api-gateway/        # Node.js + Express
│   ├── auth-service/       # PHP + JWT
│   ├── product-service/    # PHP + Catálogo
│   └── order-service/      # PHP + Transacciones
├── frontend/               # React 18 + Vite
│   ├── src/
│   │   ├── components/    # Navbar, Footer
│   │   ├── pages/         # Home, Login, Carrito, etc.
│   │   ├── store/         # Zustand state
│   │   ├── api/           # Axios client
│   │   └── styles/        # CSS por componente
├── database/               # SQL schema + seed
├── docker-compose.yml      # Orquestación
└── 📚 Documentación        # Guías completas

```

## 🧪 Test Rápido

```bash
# Verificar que todos los servicios están UP
docker-compose ps

# Ver logs en tiempo real
./logs.sh api-gateway

# Test de endpoint
curl http://localhost:5000/health

# Test de registro de usuario
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Tu Nombre","email":"tu@email.com","contraseña":"Pass123"}'
```

## 🔧 Scripts Disponibles

```bash
./start.sh              # Inicia todos los servicios
./stop.sh               # Detiene todos los servicios
./logs.sh [servicio]    # Ver logs en tiempo real
                        # Opciones: api-gateway, auth-service, etc.
```

## 💡 Ejemplos de Uso

### Crear Usuario (Registro)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan García",
    "email": "juan@example.com",
    "contraseña": "Segura123!"
  }'
```

### Obtener Productos
```bash
curl "http://localhost:5000/api/productos?page=1&limit=12"
```

### Agregar al Carrito (con autenticación)
```bash
TOKEN="tu_jwt_token_aqui"
curl -X POST http://localhost:5000/api/carrito/agregar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"producto_id": 1, "cantidad": 2}'
```

Más ejemplos en [API-REFERENCE.md](API-REFERENCE.md)

## 🐛 Troubleshooting

Si algo no funciona:

1. **Ver logs:**
   ```bash
   docker-compose logs -f [servicio]
   ```

2. **Verificar que están UP:**
   ```bash
   docker-compose ps
   ```

3. **Limpiar y reiniciar:**
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

4. **Consultar guía detallada:**
   Ver [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## 📊 Estadísticas del Proyecto

- **Microservicios:** 4 independientes
- **Endpoints:** 14 REST API
- **Componentes React:** 11
- **Líneas de código:** ~5600
- **Documentación:** 6 archivos markdown

## 🎓 Tecnologías Utilizadas

### Backend
- **Node.js 18** + Express.js (API Gateway)
- **PHP 8.1** + PDO (Servicios)
- **MySQL 8.0** (Base de datos)
- **JWT** (Autenticación)
- **Bcrypt** (Hashing)

### Frontend
- **React 18** + Hooks
- **Vite** (Build tool)
- **React Router v6** (SPA routing)
- **Zustand** (State management)
- **Axios** (HTTP client)

### DevOps
- **Docker** + **Docker Compose**
- Orquestación local con networking
- Health checks automáticos

## 🔒 Seguridad

- ✅ Autenticación JWT centralizada
- ✅ Contraseñas con bcrypt (12 rounds)
- ✅ SQL injection prevention (prepared statements)
- ✅ CORS protection
- ✅ Authorization headers

Para producción, ver [PRODUCTION-SETUP.md](PRODUCTION-SETUP.md)

## 📈 Escalabilidad

Arquitectura preparada para:
- ✅ Horizontal scaling (agregar réplicas)
- ✅ Database replication
- ✅ Caching layer (Redis-ready)
- ✅ Message queues (RabbitMQ-ready)
- ✅ Kubernetes deployment

## 🎖️ Lo que Demuestra Este Proyecto

### Arquitectura Empresarial
- Transición de monolítico a microservicios
- Patrón API Gateway
- Separación de responsabilidades
- Independencia de servicios

### Backend Moderno
- APIs RESTful
- Gestión de transacciones
- Autenticación y autorización
- Error handling robusto

### Frontend Reactivo
- SPA moderna con enrutamiento
- State management centralizado
- Componentes reutilizables
- UI responsive

### DevOps y Containerización
- Docker best practices
- Orquestación de servicios
- Health monitoring
- Networking isolado

## 📚 Lectura Recomendada

1. **Primero:** [RESUMEN-PROYECTO.md](RESUMEN-PROYECTO.md)
2. **Luego:** [README-MICROSERVICIOS.md](README-MICROSERVICIOS.md)
3. **Con problemas:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
4. **Integraciones:** [API-REFERENCE.md](API-REFERENCE.md)
5. **Para producción:** [PRODUCTION-SETUP.md](PRODUCTION-SETUP.md)

## 🤝 Soporte

Si encuentras problemas:

1. Revisar [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Ver logs: `docker-compose logs -f`
3. Verificar documentación específica del servicio en [README-MICROSERVICIOS.md](README-MICROSERVICIOS.md)
4. Consultar ejemplos en [API-REFERENCE.md](API-REFERENCE.md)

## 📞 Resumen de Comandos Útiles

```bash
# Iniciar servicios
./start.sh

# Ver estado
docker-compose ps

# Ver logs en tiempo real
./logs.sh api-gateway

# Detener servicios
./stop.sh

# Conectar a MySQL
docker-compose exec mysql mysql -utienda_user -ptienda_pass123 tienda_db

# Ejecutar comando en un contenedor
docker-compose exec api-gateway curl http://product-service:5002

# Limpiar todo (advertencia: elimina volúmenes)
docker-compose down -v
```

---

## ✨ Próximas Mejoras Sugeridas

- [ ] Implementar RabbitMQ para proceso asincrónico
- [ ] Agregar Redis para caching y sesiones
- [ ] Datos iniciales mucho más amplios
- [ ] Tests unitarios e integración
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] GraphQL API layer
- [ ] Service mesh (Istio)
- [ ] Kubernetes deployment

---

**Versión:** 2.0.0 (Microservicios)  
**Última Actualización:** 2024  
**Estado:** ✅ Producción-ready (con configuración adicional)

**¡Comienza ahora!** 👉 Ejecuta `./start.sh` e ingresa a http://localhost:3000

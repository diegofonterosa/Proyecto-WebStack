# ⚡ CHEAT SHEET - Comandos Rápidos

## 🚀 INICIAR / DETENER

### Iniciar todo
```bash
./start.sh
# O manualmente:
docker-compose up --build
```

### Detener todo
```bash
./stop.sh
# O manualmente:
docker-compose down
```

### Reiniciar un servicio
```bash
docker-compose restart api-gateway
docker-compose restart auth-service
docker-compose restart product-service
docker-compose restart order-service
docker-compose restart frontend
docker-compose restart mysql
```

---

## 📊 ESTADO Y LOGS

### Ver estado de servicios
```bash
docker-compose ps
```

### Ver logs en tiempo real
```bash
./logs.sh api-gateway
./logs.sh auth-service
./logs.sh product-service
./logs.sh order-service
./logs.sh frontend
./logs.sh mysql
./logs.sh all          # Todos
```

### Ver últimas 50 líneas de logs
```bash
docker-compose logs --tail 50 api-gateway
```

### Seguir logs últimos 10 minutos
```bash
docker-compose logs --tail 1000 -f api-gateway
```

---

## 🔌 TESTING DE ENDPOINTS

### Health Check
```bash
curl http://localhost:5000/health
```

### Registrar usuario
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Tu Nombre",
    "email": "tu@email.com",
    "contraseña": "Pass123"
  }' | jq
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu@email.com",
    "contraseña": "Pass123"
  }' | jq -r '.token' > /tmp/token.txt
```

### Obtener token guardado
```bash
TOKEN=$(cat /tmp/token.txt)
```

### Listar productos
```bash
curl "http://localhost:5000/api/productos?page=1&limit=12" | jq
```

### Obtener producto específico
```bash
curl http://localhost:5000/api/productos/1 | jq
```

### Buscar productos
```bash
curl "http://localhost:5000/api/productos/search?q=laptop" | jq
```

### Obtener categorías
```bash
curl http://localhost:5000/api/categorias | jq
```

### Ver carrito (requiere token)
```bash
TOKEN=$(cat /tmp/token.txt)
curl http://localhost:5000/api/carrito \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Agregar al carrito
```bash
TOKEN=$(cat /tmp/token.txt)
curl -X POST http://localhost:5000/api/carrito/agregar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"producto_id": 1, "cantidad": 2}' | jq
```

### Crear pedido (checkout)
```bash
TOKEN=$(cat /tmp/token.txt)
curl -X POST http://localhost:5000/api/pedidos/crear \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Ver pedidos
```bash
TOKEN=$(cat /tmp/token.txt)
curl http://localhost:5000/api/pedidos \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 🐳 DOCKER COMMANDS

### Ver todos los contenedores activos
```bash
docker-compose ps -a
```

### Ejecutar comando en contenedor
```bash
docker-compose exec api-gateway npm --version
docker-compose exec mysql mysql --version
docker-compose exec auth-service php --version
```

### Acceder a bash en contenedor
```bash
docker-compose exec api-gateway sh
docker-compose exec auth-service sh
docker-compose exec product-service sh
```

### Ver recursos usados
```bash
docker stats
```

### Limpiar todo (⚠️ elimina volúmenes)
```bash
docker-compose down -v
```

---

## 💾 DATABASE

### Conectar a MySQL
```bash
docker-compose exec mysql mysql -utienda_user -ptienda_pass123 tienda_db
```

### Ver tablas
```bash
docker-compose exec mysql mysql -utienda_user -ptienda_pass123 tienda_db -e "SHOW TABLES;"
```

### Ver usuarios
```bash
docker-compose exec mysql mysql -utienda_user -ptienda_pass123 tienda_db -e "SELECT id, nombre, email FROM usuarios;"
```

### Ver productos
```bash
docker-compose exec mysql mysql -utienda_user -ptienda_pass123 tienda_db -e "SELECT id, nombre, precio, stock FROM productos LIMIT 5;"
```

### Ver pedidos
```bash
docker-compose exec mysql mysql -utienda_user -ptienda_pass123 tienda_db -e "SELECT * FROM pedidos;"
```

### Ejecutar script SQL
```bash
docker-compose exec mysql mysql -utienda_user -ptienda_pass123 tienda_db < /ruta/archivo.sql
```

---

## 🔍 DEBUGGING

### Ver estructuras de red
```bash
docker network ls
```

### Ver red específica de tienda
```bash
docker network inspect tienda-network
```

### Probar conectividad entre contenedores
```bash
docker-compose exec api-gateway ping product-service
docker-compose exec api-gateway curl http://auth-service:5001
```

### Ver IP de un contenedor
```bash
docker inspect tienda-api-gateway | grep "IPAddress"
```

### Ver puertos mapeados
```bash
docker-compose exec api-gateway netstat -tlnp
```

---

## 📝 LOGS ÚTILES

### Ver logs con timestamps
```bash
docker-compose logs --timestamps api-gateway
```

### Ver 100 últimas líneas
```bash
docker-compose logs --tail 100 api-gateway
```

### Seguir logs en tiempo real (30 segundos)
```bash
docker-compose logs -f --tail 50 api-gateway & sleep 30; pkill -P $$
```

### Ver logs con contexto
```bash
docker-compose logs api-gateway --timestamps | grep "error\|Error\|ERROR"
```

---

## 🔧 MANTENIMIENTO

### Reconstruir un servicio
```bash
docker-compose up -d --build api-gateway
```

### Forzar recrear contenedores
```bash
docker-compose up -d --force-recreate auth-service
```

### Parar solo un servicio
```bash
docker-compose stop api-gateway
```

### Eliminar volúmenes (datos de BD)
```bash
docker-compose down -v
```

### Limpiar imágenes dangling
```bash
docker image prune -f
```

---

## 📱 ACCESO RÁPIDO A SERVICIOS

| Servicio | URL | Usuario | Contraseña |
|----------|-----|---------|-----------|
| Frontend | http://localhost:3000 | - | - |
| API Gateway | http://localhost:5000 | - | - |
| Auth Service | http://localhost:5001 | - | - |
| Product Service | http://localhost:5002 | - | - |
| Order Service | http://localhost:5003 | - | - |
| MySQL | localhost:3306 | tienda_user | tienda_pass123 |

---

## 🔐 VARIABLES DE ENTORNO

### Ver variables de un servicio
```bash
docker-compose exec api-gateway env
```

### Cambiar puerto del frontend
En `docker-compose.yml`, cambiar:
```yaml
ports:
  - "3000:3000"  # Cambiar primer 3000 al puerto deseado
```

---

## 🚨 TROUBLESHOOTING RÁPIDO

### El servicio no inicia
```bash
docker-compose logs mysql  # Ver si MySQL está OK
docker-compose up --build   # Reconstruir todo
```

### Puerto ya está en uso
```bash
lsof -i :5000
kill -9 <PID>
```

### Conectividad entre servicios
```bash
docker-compose exec api-gateway curl http://product-service:5002
# Debe retornar algo, si no hay error de conectividad
```

### Base de datos vacía
```bash
docker-compose exec mysql mysql -uroot -prootpass123 tienda_db < database/seed.sql
```

### Frontend no carga
```bash
./logs.sh frontend
# Verificar que API_GATEWAY_URL es correcto
```

---

## 📊 MONITOREO EN TIEMPO REAL

### Terminal 1: Ver todos los logs
```bash
./logs.sh all
```

### Terminal 2: Monitorear recursos
```bash
docker stats --no-stream=false
```

### Terminal 3: Hacer requests
```bash
curl http://localhost:5000/api/productos
```

---

## 🔄 WORKFLOW TÍPICO DE DESARROLLO

```bash
# Terminal 1: Iniciar servicios
./start.sh

# Terminal 2: Ver logs
./logs.sh api-gateway

# Terminal 3: Hacer requests de prueba
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Dev","email":"dev@dev.com","contraseña":"dev123"}' \
  | jq -r '.token')

# Ver respuesta
curl http://localhost:5000/api/productos -H "Authorization: Bearer $TOKEN" | jq
```

---

## 💾 EXPORTAR/IMPORTAR DATOS

### Exportar BD
```bash
docker-compose exec mysql mysqldump -utienda_user -ptienda_pass123 tienda_db > backup.sql
```

### Importar BD
```bash
docker-compose exec -T mysql mysql -utienda_user -ptienda_pass123 tienda_db < backup.sql
```

---

## 🎯 ATAJOS ÚTILES

Agregar a `.bashrc` o `.zshrc`:

```bash
# Quick start
alias tienda-start='cd /workspaces/Proyecto-WebStack && ./start.sh'
alias tienda-stop='cd /workspaces/Proyecto-WebStack && ./stop.sh'

# Quick logs
alias tienda-logs='cd /workspaces/Proyecto-WebStack && ./logs.sh'

# Quick status
alias tienda-ps='docker-compose -f /workspaces/Proyecto-WebStack/docker-compose.yml ps'

# Quick test
alias tienda-test='curl http://localhost:5000/health'
```

---

## ✅ CHECKLIST DIARIO

```bash
# ¿Están todos los servicios UP?
docker-compose ps

# ¿Responde la API?
curl http://localhost:5000/health

# ¿Puedo registrar usuario?
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","email":"test@test.com","contraseña":"test123"}'

# ¿Hay datos en BD?
docker-compose exec mysql mysql -utienda_user -ptienda_pass123 tienda_db \
  -e "SELECT COUNT(*) FROM productos;"

# ¿El frontend carga?
curl http://localhost:3000 | head -20
```

---

## 📞 AYUDA RÁPIDA

```bash
# ¿Qué puerto usa tal servicio?
grep "ports:" docker-compose.yml

# ¿Cuál es el JWT_SECRET?
grep JWT_SECRET microservices/*-service/.env

# ¿Cuál es la contraseña de MySQL?
grep MYSQL microservices/*-service/.env
```

---

**Versión:** 2.0  
**Última actualización:** 2024  
**Palabras clave:** docker, curl, mysql, logs, debug, troubleshoot

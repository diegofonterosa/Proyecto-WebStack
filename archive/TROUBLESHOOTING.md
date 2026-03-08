# 🔧 Guía de Resolución de Problemas - Tienda Reactiva Microservicios

## Problemas Comunes y Soluciones

### 1. Los servicios no inician

**Problema:** `docker-compose up` falla o los contenedores se cierran inmediatamente

**Solución:**
```bash
# Ver los logs de error
docker-compose logs mysql
docker-compose logs api-gateway

# Limpiar y reconstruir
docker-compose down -v
docker-compose up --build
```

### 2. MySQL no está disponible cuando inician los servicios

**Problema:** Los servicios PHP no pueden conectar a MySQL

**Solución:** MySQL requiere tiempo para iniciar. Docker Compose usa `healthcheck` pero puede necesitar más tiempo:
```bash
# Espera manualmente a que MySQL esté listo
docker-compose up mysql -d
sleep 30
docker-compose up
```

### 3. Puerto ya está en uso

**Problema:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solución:**
```bash
# Encontrar qué proceso usa el puerto
lsof -i :5000  # o netstat -tulpn | grep 5000

# Killear el proceso
kill -9 <PID>

# O cambiar el puerto en docker-compose.yml
# Para API Gateway: de "5000:5000" a "5001:5000" etc.
```

### 4. Frontend no puede conectar a la API

**Problema:** Errores CORS, 404 en requests a `/api`

**Solución:**
```bash
# Verificar que el API Gateway está corriendo
curl http://localhost:5000/health

# En el navegador, ver la consola del navegador (F12)
# El error debe mostrar qué falta

# Asegurar que VITE_API_URL es correcto en frontend/.env
# Para desarrollo local: http://localhost:5000/api
```

### 5. Base de datos vacía, sin productos

**Problema:** Carrito vacío, no hay productos disponibles

**Solución:**
```bash
# Verificar que los scripts SQL se ejecutaron
docker-compose exec mysql mysql -uroot -prootpass123 tienda_db -e "SELECT COUNT(*) FROM productos;"

# Si está vacío, insertar datos manualmente o reimportar SQL
docker-compose exec mysql mysql -uroot -prootpass123 tienda_db < database/seed.sql
```

### 6. Error de autenticación "Token inválido"

**Problema:** Login falla con "token inválido"

**Solución:**
```bash
# Verificar que el JWT_SECRET es el mismo en todos los servicios
grep JWT_SECRET microservices/*-service/.env*

# Limpiar localStorage en el navegador
# F12 → Application → Local Storage → borrar token

# Reintentar login
```

### 7. Producto no aparece en carrito después de agregar

**Problema:** El carrito muestra 0 items aunque se agregó

**Solución:**
```bash
# Verificar que hay usuario logueado
# Chequear console del navegador para errores 401/403

# Verificar que el token está siendo enviado
curl -H "Authorization: Bearer {token}" http://localhost:5000/api/carrito

# Si falla, reintentar login
```

### 8. React dev server no está recompilando

**Problema:** Los cambios en JSX no se reflejan en el navegador

**Solución:**
```bash
# Ver logs del frontend
docker-compose logs -f frontend

# Hot reload debe estar activo en Vite
# Si no funciona, reiniciar contenedor
docker-compose restart frontend
```

### 9. MySQL se detiene sin motivo

**Problema:** El contenedor MySQL aparece como "Exited"

**Solución:**
```bash
# Ver razón de la salida
docker-compose logs mysql

# Si es por memory/disk issues
docker system prune -a  # Limpiar imágenes no usadas

# Reiniciar docker daemon
sudo systemctl restart docker

# Recomponer
docker-compose down -v  # -v elimina volúmenes
docker-compose up
```

### 10. Error "Cannot GET /api/productos"

**Problema:** La API Gateway no está enrutando correctamente

**Solución:**
```bash
# Verificar que el Product Service está corriendo
docker-compose exec api-gateway curl http://product-service:5002

# Verificar .env del API Gateway
cat microservices/api-gateway/.env | grep PRODUCT_SERVICE_URL

# Debe ser: http://product-service:5002 (Docker DNS)
# NO debe ser: http://localhost:5002
```

### 11. El carrito no persiste después de recargar

**Problema:** El carrito se vacía al recargar la página

**Solución (esperado):**
- El carrito está en memoria (Zustand store)
- Se guarda en MongoDB/Redis en producción
- Para desarrollo local, es normal que se vacíe
- Para persistencia, agregar localStorage:

```javascript
// En store/index.js
const useCartStore = create(
  persist(
    (set) => ({ ... }),
    { name: 'cart' }  // Guarda en localStorage
  )
)
```

### 12. Errores de CORS en desarrollo

**Problema:** `Access-Control-Allow-Origin: *` error

**Solución:**
```bash
# El API Gateway debe permitir el origen del frontend
# En microservices/api-gateway/.env:
ALLOW_ORIGINS=http://localhost:3000,http://frontend:3000

# Los servicios individuales también deben permitir CORS
# Verificar que cada servicio PHP devuelva headers CORS
```

## 🔍 Debugging Avanzado

### Conectarse a MySQL desde CLI

```bash
docker-compose exec mysql mysql -utienda_user -ptienda_pass123 tienda_db

# Una vez dentro:
> SHOW TABLES;
> SELECT * FROM usuarios;
> SELECT COUNT(*) FROM productos;
```

### Ejecutar comando en un contenedor

```bash
# Ver el sistema de archivos
docker-compose exec api-gateway ls -la /app

# Reiniciar un servicio específico
docker-compose restart auth-service

# Eliminar un contenedor y reconstruir
docker-compose up --detach --force-recreate auth-service
```

### Ver recursos usados

```bash
# CPU, memoria, red
docker stats

# Detalle de un contenedor
docker inspect tienda-api-gateway
```

### Verificar conectividad entre servicios

```bash
# Desde dentro de un contenedor
docker-compose exec api-gateway ping product-service

# Desde dentro del contenedor de un servicio
docker-compose exec product-service curl http://auth-service:5001
```

## 📊 Verificación de Funcionalidad

### Checklist de Inicio

```bash
# 1. ¿Están todos los contenedores UP?
docker-compose ps
# Todos deben mostrar "Up"

# 2. ¿Responde el health check?
curl http://localhost:5000/health
# Debe retornar JSON con status ok

# 3. ¿Pueden registrarse usuarios?
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","email":"test@test.com","contraseña":"test123"}'

# 4. ¿Se pueden obtener productos?
curl http://localhost:5000/api/productos

# 5. ¿Está disponible el frontend?
curl http://localhost:3000
# Debe devolver HTML
```

## 🆘 Solicitar Ayuda

Si el problema persiste:

1. **Recopilar información:** 
```bash
docker-compose ps
docker-compose logs > logs.txt
```

2. **Verificar especificaciones:**
   - Versión Docker: `docker --version`
   - Espacio disponible: `df -h`
   - Memoria disponible: `free -h`

3. **Código de barras de diagnóstico:**
```bash
echo "=== Docker ===" && docker --version
echo "=== Compose ===" && docker-compose --version
echo "=== Contenedores ===" && docker-compose ps
echo "=== Health ===" && curl -s http://localhost:5000/health || echo "API DOWN"
```

---

**Última actualización:** 2024
**Versión:** 1.0.1

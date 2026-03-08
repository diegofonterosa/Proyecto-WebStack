# 📡 Guía Rápida de API Endpoints

## 🔐 Autenticación (Auth Service - Puerto 5001)

### Registro de Nuevo Usuario
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "contraseña": "MiPassword123"
  }'

# Response:
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "usuario": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@example.com"
  }
}
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "contraseña": "MiPassword123"
  }'

# Response: Mismo que registro (retorna token)
```

### Verificar Token
```bash
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

curl -X GET http://localhost:5000/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"

# Response:
{
  "success": true,
  "valido": true,
  "usuario_id": 1,
  "email": "juan@example.com"
}
```

---

## 🛍️ Productos (Product Service - Puerto 5002)

### Listar Productos Paginados
```bash
# Página 1, 12 productos por página (defecto)
curl http://localhost:5000/api/productos

# Página 2, 20 productos por página
curl "http://localhost:5000/api/productos?page=2&limit=20"

# Response:
{
  "datos": [
    {
      "id": 1,
      "nombre": "MacBook Pro M2",
      "descripcion": "Laptop profesional de alto rendimiento",
      "precio": 1999.99,
      "stock": 25,
      "categoria": "Electrónica",
      "imagen_url": "https://example.com/macbook.jpg",
      "fecha_creacion": "2024-01-01T10:00:00Z"
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 145,
    "pages": 13
  }
}
```

### Obtener Producto por ID
```bash
curl http://localhost:5000/api/productos/1

# Response: Un objeto producto (mismo formato)
```

### Búsqueda de Productos
```bash
# Buscar por término
curl "http://localhost:5000/api/productos/search?q=laptop"

# Buscar con filtro de categoría
curl "http://localhost:5000/api/productos/search?q=laptop&categoria=Electrónica"

# Response: Array de productos (mismo formato que listar)
```

### Listar Categorías
```bash
curl http://localhost:5000/api/categorias

# Response:
{
  "datos": [
    {
      "categoria": "Electrónica",
      "cantidad": 45
    },
    {
      "categoria": "Ropa",
      "cantidad": 32
    },
    {
      "categoria": "Hogar",
      "cantidad": 68
    }
  ]
}
```

---

## 🛒 Carrito (Order Service - Puerto 5003)

### Ver Carrito
```bash
TOKEN="tu_jwt_token_aqui"

curl -X GET http://localhost:5000/api/carrito \
  -H "Authorization: Bearer $TOKEN"

# Response:
{
  "items": [
    {
      "producto_id": 1,
      "nombre": "MacBook Pro M2",
      "precio": 1999.99,
      "cantidad": 1,
      "subtotal": 1999.99
    }
  ],
  "total": 1999.99,
  "cantidad_items": 1
}
```

### Agregar Producto al Carrito
```bash
TOKEN="tu_jwt_token_aqui"

curl -X POST http://localhost:5000/api/carrito/agregar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "producto_id": 1,
    "cantidad": 2
  }'

# Response:
{
  "success": true,
  "mensaje": "Producto agregado al carrito",
  "items_totales": 3
}
```

### Eliminar del Carrito
```bash
TOKEN="tu_jwt_token_aqui"

curl -X DELETE http://localhost:5000/api/carrito/1 \
  -H "Authorization: Bearer $TOKEN"

# Response:
{
  "success": true,
  "mensaje": "Producto eliminado del carrito"
}
```

---

## 📦 Pedidos (Order Service - Puerto 5003)

### Crear Pedido (Checkout)
```bash
TOKEN="tu_jwt_token_aqui"

curl -X POST http://localhost:5000/api/pedidos/crear \
  -H "Authorization: Bearer $TOKEN"

# Response:
{
  "success": true,
  "pedido_id": 42,
  "usuario_id": 1,
  "total": 1999.99,
  "estado": "completado",
  "fecha": "2024-01-15T14:30:00Z",
  "items": 2
}
```

### Listar Pedidos del Usuario
```bash
TOKEN="tu_jwt_token_aqui"

curl -X GET http://localhost:5000/api/pedidos \
  -H "Authorization: Bearer $TOKEN"

# Response:
{
  "datos": [
    {
      "pedido_id": 42,
      "fecha": "2024-01-15T14:30:00Z",
      "total": 1999.99,
      "estado": "completado",
      "items": 2
    }
  ],
  "total_pedidos": 1
}
```

### Obtener Detalle de Pedido
```bash
TOKEN="tu_jwt_token_aqui"

curl -X GET http://localhost:5000/api/pedidos/42 \
  -H "Authorization: Bearer $TOKEN"

# Response:
{
  "pedido": {
    "pedido_id": 42,
    "usuario_id": 1,
    "fecha": "2024-01-15T14:30:00Z",
    "total": 1999.99,
    "estado": "completado"
  },
  "detalles": [
    {
      "producto_id": 1,
      "nombre": "MacBook Pro M2",
      "precio_unitario": 1999.99,
      "cantidad": 1,
      "subtotal": 1999.99
    }
  ]
}
```

---

## 🏥 Health Check

### Estado General de la API
```bash
curl http://localhost:5000/health

# Response:
{
  "status": "ok",
  "timestamp": "2024-01-15T14:30:00Z",
  "services": {
    "auth": "operational",
    "products": "operational",
    "orders": "operational"
  }
}
```

---

## 📋 Códigos de Error Comunes

### 401 Unauthorized
```json
{
  "error": "Token no válido o expirado",
  "codigo": 401
}
```
**Solución:** Hacer login nuevamente y obtener token válido

### 403 Forbidden
```json
{
  "error": "No tienes permisos para esta acción",
  "codigo": 403
}
```
**Solución:** Verificar que el usuario está autenticado en la sesión correcta

### 404 Not Found
```json
{
  "error": "Recurso no encontrado",
  "codigo": 404
}
```
**Solución:** Verificar la URL y el ID del recurso

### 400 Bad Request
```json
{
  "error": "Datos inválidos",
  "detalles": "El campo 'cantidad' debe ser un número entero",
  "codigo": 400
}
```
**Solución:** Revisar el formato JSON y los parámetros enviados

### 500 Internal Server Error
```json
{
  "error": "Error del servidor",
  "codigo": 500
}
```
**Solución:** Revisar logs del servicio con `docker-compose logs [servicio]`

---

## 🔗 Flujo Completo de Ejemplo

### 1. Registrarse
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María García",
    "email": "maria@example.com",
    "contraseña": "Segura123!"
  }' | jq '.token' -r > token.txt
```

### 2. Ver Productos Disponibles
```bash
curl http://localhost:5000/api/productos | jq '.datos[] | {id, nombre, precio}'
```

### 3. Agregar al Carrito
```bash
TOKEN=$(cat token.txt)
curl -X POST http://localhost:5000/api/carrito/agregar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"producto_id": 1, "cantidad": 2}'
```

### 4. Ver Carrito
```bash
TOKEN=$(cat token.txt)
curl http://localhost:5000/api/carrito \
  -H "Authorization: Bearer $TOKEN" | jq '.total'
```

### 5. Crear Pedido
```bash
TOKEN=$(cat token.txt)
curl -X POST http://localhost:5000/api/pedidos/crear \
  -H "Authorization: Bearer $TOKEN" | jq '.pedido_id'
```

### 6. Ver Historial de Pedidos
```bash
TOKEN=$(cat token.txt)
curl http://localhost:5000/api/pedidos \
  -H "Authorization: Bearer $TOKEN" | jq '.datos'
```

---

## 🧪 Testing con Python

```python
import requests
import json

BASE_URL = "http://localhost:5000/api"

# 1. Registro
response = requests.post(
    f"{BASE_URL}/auth/register",
    json={
        "nombre": "Test Usuario",
        "email": "test@example.com",
        "contraseña": "Test123!"
    }
)
token = response.json()["token"]
print(f"✅ Usuario creado. Token: {token[:20]}...")

# 2. Obtener productos
response = requests.get(f"{BASE_URL}/productos")
productos = response.json()["datos"]
producto_id = productos[0]["id"]
print(f"✅ Productos obtenidos. Primer producto: {productos[0]['nombre']}")

# 3. Agregar al carrito
headers = {"Authorization": f"Bearer {token}"}
requests.post(
    f"{BASE_URL}/carrito/agregar",
    headers=headers,
    json={"producto_id": producto_id, "cantidad": 1}
)
print("✅ Producto agregado al carrito")

# 4. Ver carrito
response = requests.get(f"{BASE_URL}/carrito", headers=headers)
carrito = response.json()
print(f"✅ Carrito total: ${carrito['total']}")

# 5. Crear pedido
response = requests.post(f"{BASE_URL}/pedidos/crear", headers=headers)
pedido_id = response.json()["pedido_id"]
print(f"✅ Pedido creado: #{pedido_id}")
```

---

**Última actualización:** 2024
**Compatibilidad API:** v1.0

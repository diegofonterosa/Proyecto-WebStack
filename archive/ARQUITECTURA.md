# 🏗️ ARQUITECTURA Y DISEÑO

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Navegador)                      │
│                     HTML/CSS/JavaScript                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    HTTP/HTTPS (Request)
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    INTERNET / Firewall                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  CAPA DE PRESENTACIÓN                       │
│  Nginx (Reverse Proxy, Load Balancer, HTTPS)              │
│  - Manejo de conexiones estáticas                          │
│  - Enrutamiento a PHP-FPM                                 │
│  - Compresión gzip                                        │
│  - Cache de recursos                                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
             FastCGI Protocol (TCP Port 9000)
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   CAPA DE APLICACIÓN                        │
│  PHP 8.2-FPM                                               │
│  ┌────────────────────────────────────────┐               │
│  │ public/index.php (Router Principal)   │               │
│  │ - Parsea URL                          │               │
│  │ - Rutea a vista correspondiente       │               │
│  │ - Maneja lógica de negocios           │               │
│  └────────────────────────────────────────┘               │
│  ┌────────────────────────────────────────┐               │
│  │ src/classes/ (Lógica de Negocio)      │               │
│  │ - User.php                            │               │
│  │ - Product.php                         │               │
│  │ - Cart.php                            │               │
│  │ - Session.php                         │               │
│  │ - Security.php                        │               │
│  └────────────────────────────────────────┘               │
│  ┌────────────────────────────────────────┐               │
│  │ src/config/ (Configuración)           │               │
│  │ - Database.php (PDO Singleton)       │               │
│  │ - Config.php (Constantes)            │               │
│  └────────────────────────────────────────┘               │
│  ┌────────────────────────────────────────┐               │
│  │ views/ (Templates HTML)                │               │
│  │ - Generan HTML dinámico               │               │
│  │ - Escape de datos (Security)          │               │
│  └────────────────────────────────────────┘               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    TCP Connection (3306)
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   CAPA DE DATOS                             │
│  MySQL 8.0 (Base de Datos Relacional)                      │
│  ┌────────────────────────────────────────┐               │
│  │ Tablas:                                │               │
│  │ - usuarios        (Autenticación)      │               │
│  │ - productos       (Catálogo)          │               │
│  │ - carrito         (Compras)           │               │
│  │ - pedidos         (Órdenes)          │               │
│  │ - pedido_detalles (Líneas)           │               │
│  │ - sesiones        (Sessions)         │               │
│  │ - auditoria       (Logs seguridad)   │               │
│  └────────────────────────────────────────┘               │
│  - Índices para performance                              │
│  - Búsqueda fulltext en productos                        │
│  - Integridad referencial (Foreign Keys)                 │
└──────────────────────────────────────────────────────────────┘
```

## Patrón Arquitectónico: MVC (Model-View-Controller)

### Model (Modelo)
```
app/src/classes/
├── User.php        # Lógica de usuarios
├── Product.php     # Lógica de productos
├── Cart.php        # Lógica de carrito
└── Session.php     # Gestión de sesiones
```

**Responsabilidades:**
- Lógica de negocio
- Acceso a base de datos
- Validaciones

### View (Vista)
```
app/views/
├── layouts/
│   ├── header.php
│   └── footer.php
├── index.php       # Catálogo
├── producto.php    # Detalle
├── carrito.php     # Carrito
└── login.php       # Autenticación
```

**Responsabilidades:**
- Presentar datos
- Escapar output (seguridad)
- Interfaz de usuario

### Controller (Controlador)
```
app/public/index.php
```

**Responsabilidades:**
- Enrutamiento (URL → acción)
- Llamar modelos
- Pasar datos a vistas

### Ejemplo de Flujo MVC

```
1. Cliente request → GET /producto/123

2. index.php (Controller)
   └─ Parsea URL
   └─ Extrae parámetro id=123

3. Product.php (Model)
   └─ findById(123)
   └─ Query SELECT * FROM productos WHERE id=123
   └─ Retorna objeto Product

4. producto.php (View)
   └─ Recibe $producto
   └─ Genera HTML dinámico
   └─ Escapa datos (XSS protection)

5. Cliente recibe HTML + CSS + JS
```

## Flujo de una Petición HTTP

```
┌──────────────────────────────────────────────────────────────┐
│ FASE 1: PETICIÓN                                             │
└──────────────────────────────────────────────────────────────┘

[Cliente] 
   │
   ├─ 1. Resuelve DNS: ejemplo.com → 192.168.1.100
   ├─ 2. Crea conexión TCP (Three-way Handshake)
   └─ 3. Envía petición HTTP
   
GET /producto/123 HTTP/1.1
Host: ejemplo.com
User-Agent: Mozilla/5.0
Cookies: session_id=abc123
[body vacio para GET]

┌──────────────────────────────────────────────────────────────┐
│ FASE 2: PROCESAMIENTO EN SERVIDOR                            │
└──────────────────────────────────────────────────────────────┘

[Nginx: Puerto 80]
   │
   ├─ 1. Recibe petición HTTP
   ├─ 2. Normaliza URI: /producto/123
   ├─ 3. Decide: ¿contenido estático o dinámico?
   └─ 4. Enruta a PHP-FPM (FastCGI)
   
[PHP-FPM: Puerto 9000]
   │
   ├─ 1. Carga index.php
   ├─ 2. Inicia sesión
   ├─ 3. Carga clases necesarias
   └─ 4. Analiza ruta: preg_match('/producto/(\d+)/')
   
[Modelo: Product]
   │
   ├─ 1. Llama findById(123)
   ├─ 2. Valida que no sea SQL injection
   ├─ 3. Conecta a MySQL con PDO
   ├─ 4. Ejecuta prepared statement
   └─ 5. Retorna objeto Product

[MySQL]
   │
   ├─ 1. SELECT * FROM productos WHERE id = 123
   ├─ 2. Busca índice (rápido)
   ├─ 3. Retorna fila si existe
   └─ 4. Cierra conexión

[View: producto.php]
   │
   ├─ 1. Recibe objeto $producto
   ├─ 2. Genera HTML dinámico
   ├─ 3. Escapa todos los datos
   └─ 4. Agrega CSS, JS, etc

[Nginx]
   │
   └─ Prepara respuesta HTTP con headers

┌──────────────────────────────────────────────────────────────┐
│ FASE 3: RESPUESTA                                            │
└──────────────────────────────────────────────────────────────┘

HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 15320
Cache-Control: max-age=3600
Vary: Accept-Encoding
Content-Encoding: gzip
Set-Cookie: session_id=xyz789; HttpOnly; Secure; SameSite=Lax

<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
    <!-- Contenido del producto -->
  </body>
</html>

[Cliente recibe respuesta]
   │
   ├─ 1. Parsea HTML
   ├─ 2. Descarga CSS, JS, imágenes (múltiples requests)
   ├─ 3. Aplica CSS (CSSOM)
   ├─ 4. Ejecuta JavaScript
   └─ 5. Renderiza página final
```

## Seguridad en Capas

```
┌────────────────────────────────────────┐
│  Nginx                                 │
│  - HTTPS/TLS                          │
│  - Rate Limiting                      │
│  - CORS Headers                       │
├────────────────────────────────────────┤
│  PHP Aplicación                        │
│  - Validación de entrada              │
│  - CSRF Protection                    │
│  - XSS Filtering                      │
├────────────────────────────────────────┤
│  Base de Datos                         │
│  - Prepared Statements                │
│  - Permisos limitados                 │
│  - Usar usuario específico            │
├────────────────────────────────────────┤
│  Servidor                              │
│  - Firewall                           │
│  - SSH keys                           │
│  - Actualizaciones de seguridad       │
└────────────────────────────────────────┘
```

## Patrones de Diseño Utilizados

### 1. Singleton
```php
// Database.php
class Database {
    private static ?Database $instance = null;
    
    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
}
```
**Propósito:** Una única conexión a BD en toda la app

### 2. Factory
```php
// Product::findById() crea instancias de Product
public static function findById(int $id): ?Product {
    $db = Database::getInstance();
    $data = $db->queryOne(...);
    
    $product = new Product();
    $product->id = $data['id'];
    // ... más propiedades
    return $product;
}
```

### 3. Repository
```php
// Product actúa como repositorio de productos
class Product {
    public static function getAll() { ... }
    public static function search() { ... }
    public static function getByCategory() { ... }
}
```

### 4. Service
```php
// Session maneja toda la lógica de sesiones
class Session {
    public static function start() { ... }
    public static function setUser() { ... }
    public static function isAuthenticated() { ... }
}
```

## Performance

### Optimizaciones Implementadas

1. **Índices en Base de Datos**
   ```sql
   INDEX idx_categoria (categoria)
   INDEX idx_precio (precio)
   INDEX idx_usuario (usuario_id)
   FULLTEXT INDEX idx_fulltext_productos (nombre, descripcion)
   ```

2. **Compresión Gzip**
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json;
   ```

3. **Cache en Navegador**
   ```nginx
   Cache-Control: max-age=3600  <!-- 1 hora -->
   ```

4. **Prepared Statements**
   - Mejor parsing de SQL
   - Reutilización de planes de ejecución

5. **Conexión Persistente PHP-FPM**
   - No reconecta a BD en cada request

## Escalabilidad

### Para Aumentar Carga

1. **Load Balancing**
   ```
   [LB Nginx] ─┬─ [Nginx 1]
               ├─ [Nginx 2]
               └─ [Nginx 3]
               
   Todos comparten [MySQL Master]
   ```

2. **Replicación MySQL**
   ```
   [MySQL Master] ──┬─ [MySQL Slave 1]
                    └─ [MySQL Slave 2]
   ```

3. **Cache (Redis)**
   ```
   [Nginx] ──┬─ [Redis Cache]
             └─ [MySQL]
   ```

4. **CDN para Recursos Estáticos**
   ```
   [Cliente] ──┬─ [CDN] (CSS, JS, imágenes)
               └─ [Servidor] (HTML dinámico)
   ```

## Diagrama de Relaciones de BD

```
usuarios (1)
    │
    ├─── carrito (N)
    │
    ├─── pedidos (N)
    │        │
    │        └─── pedido_detalles (N)
    │               │
    │               └─── productos (N)
    │
    └─── auditoria (N)

productos
    │
    ├─── carrito (N) ──── usuarios
    │
    └─── pedido_detalles (N) ──── pedidos
                                    │
                                    └─── usuarios
```

## Decisiones de Diseño

### ¿Por qué Nginx en lugar de Apache?
- ✅ Mejor handling de concurrencia (event-driven)
- ✅ Menor consumo de memoria
- ✅ Configuración simple
- ❌ Requiere PHP-FPM separado (pero es mejor separación)

### ¿Por qué MySQL en lugar de NoSQL?
- ✅ Datos relacionales (usuarios, pedidos, productos)
- ✅ ACID transactions (integridad de pedidos)
- ✅ Queries complejas con JOINs
- ✅ Cost (gratuito)

### ¿Por qué Docker?
- ✅ Portabilidad (funciona en cualquier máquina)
- ✅ Aislamiento (cada servicio en su contenedor)
- ✅ Fácil de escalar
- ✅ Compatible con DevOps

### ¿Por qué PHP?
- ✅ Lenguaje web tradicional, muy usado
- ✅ Fácil de aprender y desplegar
- ✅ Comunidad grande
- ✅ Performance adecuado para este proyecto

## Monitoreo y Logging

```
PHP Errors
    └─ /app/logs/php_errors.log

Nginx Access
    └─ /var/log/nginx/access.log

Nginx Errors
    └─ /var/log/nginx/error.log

DB Auditoría
    └─ tabla 'auditoria'
       ├─ usuario_id
       ├─ accion (login, logout, etc)
       ├─ ip_address
       └─ fecha
```

## Stack Tecnológico Final

```
Frontend:    HTML5, CSS3, JavaScript (Vanilla)
Backend:     PHP 8.2, FastCGI Protocol
Server:      Nginx 1.24, Reverse Proxy
App Engine:  PHP-FPM Process Manager
Database:    MySQL 8.0
Container:   Docker, Docker Compose
OS:          Linux (Debian/Ubuntu)
Security:    OpenSSL, bcrypt, CORS, CSRF tokens
```

---

*Documento generado como parte de la Consultoría de Publicación Web 2026*

# 📖 INSTALACIÓN Y USO

## Requisitos Previos

- Docker y Docker Compose instalados
- 2GB de RAM disponible
- 500MB de espacio en disco

## Pasos de Instalación

### 1. Clonar/Descargar el Proyecto

```bash
cd /workspaces/Proyecto-WebStack
```

### 2. Hacer Scripts Ejecutables

```bash
chmod +x scripts/*.sh
```

### 3. Iniciar la Aplicación

```bash
./scripts/start.sh
```

Este script automáticamente:
- Construye las imágenes Docker
- Inicia los contenedores (Nginx, PHP, MySQL)
- Espera a que MySQL esté listo
- Configura permisos

### 4. Acceder a la Aplicación

Abre tu navegador y ve a:
```
http://localhost
```

## Cuentas de Prueba

### Administrador
- **Email**: admin@tienda.local
- **Contraseña**: Tienda123456

### Cliente Demo
- **Email**: demo@tienda.local
- **Contraseña**: Tienda123456

## Comandos Útiles

### Ver Logs

```bash
# Logs de PHP
docker-compose logs -f php

# Logs de Nginx
docker-compose logs -f nginx

# Logs de MySQL
docker-compose logs -f db

# Todos los logs
docker-compose logs -f
```

### Acceder a la Base de Datos

```bash
# Conexión MySQL
docker-compose exec db mysql -u tienda_user -ptienda_pass123 tienda_db

# Ver tablas
SHOW TABLES;

# Ver usuarios
SELECT id, nombre, email, rol FROM usuarios;
```

### Ejecutar Comandos en PHP

```bash
# Acceso a shell PHP
docker-compose exec php bash

# Ejecutar PHP
docker-compose exec php php -r "echo phpinfo();"
```

### Backup de Base de Datos

```bash
./scripts/backup.sh
```

Crea un archivo comprimido en `./backups/`

### Restaurar Base de Datos

```bash
./scripts/restore.sh backups/db_backup_YYYYMMDD_HHMMSS.sql.gz
```

### Verificación de Seguridad

```bash
./scripts/security-check.sh
```

## Detener la Aplicación

```bash
./scripts/stop.sh
```

O manualmente:
```bash
docker-compose down
```

## Problemas Comunes

### Puerto 80 ya está en uso

```bash
# Encontrar qué está usando el puerto
sudo lsof -i :80

# Cambiar el puerto en docker-compose.yml
# ports:
#   - "8080:80"

# Luego acceder a http://localhost:8080
```

### MySQL no inicia

```bash
# Limpiar volumen de datos
docker-compose down -v
./scripts/start.sh
```

### Permisos de archivo denegados

```bash
# Reconstruir y reiniciar
docker-compose up -d --build

# O ejecutar desde script
./scripts/start.sh
```

### Conexión a BD rechazada

```bash
# Esperar más tiempo
sleep 10

# Verificar logs
docker-compose logs db

# Reiniciar MySQL
docker-compose restart db
```

## Estructura del Proyecto

```
Proyecto-WebStack/
├── app/
│   ├── public/                 # Punto de entrada web
│   │   ├── index.php          # Enrutador principal
│   │   ├── css/style.css      # Estilos
│   │   └── js/main.js         # JavaScript
│   ├── src/
│   │   ├── config/            # Configuración (BD)
│   │   └── classes/           # Clases PHP (User, Product, Cart, etc)
│   └── views/                 # Templates HTML
├── docker/                    # Archivos Docker
│   ├── Dockerfile            # Imagen PHP
│   └── nginx.conf            # Configuración Nginx
├── database/
│   └── init.sql             # Schema inicial
├── scripts/                 # Scripts de utilidad
├── docker-compose.yml       # Orquestación
└── README.md               # Este archivo
```

## Funcionalidades Implementadas

✅ **Catálogo Producción**
- Listado/paginación
- Búsqueda fulltext
- Filtrado por categoría

✅ **Carrito de Compras**
- Agregar/remover productos
- Actualizar cantidades
- Cálculo automático de totales

✅ **Autenticación**
- Registro de usuarios
- Login/logout
- Validación de contraseñas fuertes

✅ **Seguridad**
- Hash bcrypt de contraseñas
- Protección CSRF
- Escape XSS
- Headers HTTP seguros
- SQL Injection prevention
- Validación en servidor

✅ **Base de Datos**
- 8 tablas relacionales
- Índices de performance
- Búsqueda fulltext
- Auditoría de acciones

✅ **Arquitectura**
- Nginx + PHP-FPM
- Contenedores Docker
- Sesiones seguras
- Arquitectura MVC

## Configuración para Producción

### 1. Habilitar HTTPS

```nginx
# En docker/nginx.conf, descomentar la sección HTTPS
# Instalar certificado Let's Encrypt:
certbot certonly --nginx -d tu-dominio.com
```

### 2. Actualizar Variables de Ambiente

```bash
cp .env.example .env
# Editar .env con datos reales
```

### 3. Cambiar Contraseñas de BD

```bash
# Editar docker-compose.yml
MYSQL_ROOT_PASSWORD: contraseña_nueva
MYSQL_PASSWORD: contraseña_nueva
```

### 4. Habilitar Backups Automáticos

```bash
# Agregar a crontab
0 2 * * * /path/to/scripts/backup.sh
```

### 5. Monitoreo 24/7

```bash
# Instalar supervisor para reinicio automático
docker-compose up -d --restart unless-stopped
```

## Desarrollo

### Agregar Nuevas Funcionalidades

1. Crear clase en `app/src/classes/`
2. Crear vista en `app/views/`
3. Agregar ruta en `app/public/index.php`

### Ejemplo: Nueva Página

```php
// app/src/classes/MyFeature.php
namespace App\Classes;
class MyFeature { ... }

// app/views/myfeature.php
<h1>Mi Característica</h1>

// app/public/index.php
elseif ($request_uri === '/myfeature') {
    require __DIR__ . '/../views/myfeature.php';
}
```

### Testing

```bash
# Acceder a container PHP
docker-compose exec php bash

# Ejecutar tests (si hay PHPUnit)
./vendor/bin/phpunit
```

## Documentación Completa

Ver [README.md](../README.md) para documentación técnica completa y análisis arquitectónico.

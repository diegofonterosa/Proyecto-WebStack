# 🔒 GUÍA DE SEGURIDAD

## Medidas de Seguridad Implementadas

### 1. Autenticación y Autorización

#### ✅ Hash de Contraseñas
```php
// Bcrypt con costo 12 (máximo)
password_hash($password, PASSWORD_BCRYPT, ['cost' => 12])
```

#### ✅ Validación de Contraseña Fuerte
- Mínimo 8 caracteres
- Al menos 1 letra mayúscula
- Al menos 1 dígito
- Caracteres especiales opcionales

#### ✅ Control de Sesión
- Regeneración de ID de sesión
- HttpOnly flag en cookies
- SameSite=Lax
- Timeout de 1 hora

#### ✅ Roles y Permisos
- Cliente: Solo ver y comprar
- Admin: Gestionar productos

### 2. Inyección SQL

#### ✅ Prepared Statements
```php
// ✅ CORRECTO
$stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
$stmt->execute([$email]);

// ❌ INCORRECTO
$sql = "SELECT * FROM usuarios WHERE email = '$email'";
```

#### ✅ Validación de Entrada
```php
// Validar tipos de datos
$id = Security::validateInt($_GET['id']);
$precio = Security::validateFloat($_GET['precio']);
```

### 3. Cross-Site Scripting (XSS)

#### ✅ Escape de Output
```php
// ✅ CORRECTO
<?= htmlspecialchars($user['nombre']) ?>

// ❌ INCORRECTO
<?= $user['nombre'] ?>
```

#### ✅ Content Security Policy
```php
header("Content-Security-Policy: default-src 'self'; script-src 'self'");
```

### 4. Cross-Site Request Forgery (CSRF)

#### ✅ Token CSRF en Formularios
```html
<!-- En cada formulario -->
<?= Security::getCSRFInput() ?>

<!-- En PHP -->
if (!Security::validateCSRF($_POST['csrf_token'] ?? '')) {
    die('Token inválido');
}
```

### 5. Encriptación en Tránsito

#### ✅ HTTPS/TLS
- Certificado SSL/TLS (Let's Encrypt)
- Protocolo TLS 1.2+
- Cipher suites fuertes

#### ✅ Headers de Seguridad HTTP
```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000";
```

### 6. Autenticación de Base de Datos

#### ✅ Credenciales
- Usuario dedicado (no root)
- Contraseña fuerte
- Permisos limitados

```sql
-- Crear usuario con permisos específicos
CREATE USER 'tienda_user'@'%' IDENTIFIED BY 'contraseña_fuerte';
GRANT SELECT, INSERT, UPDATE, DELETE ON tienda_db.* TO 'tienda_user'@'%';
```

### 7. Errores y Logging

#### ✅ No Exponer Información
```php
// En producción
ini_set('display_errors', 0);  // No mostrar errores
ini_set('log_errors', 1);      // Registrar en logs
```

#### ✅ Logging de Auditería
```php
// app/src/classes/Security.php
Security::logAction($accion, $detalles, $usuarioId);
// Registra en tabla 'auditoria'
```

### 8. Protección contra Fuerza Bruta

#### ✅ Rate Limiting
```php
// Implementar en producción con servicio como Fail2ban
// Límite de intentos de login fallidos
```

### 9. Validación de Email

#### ✅ Validación de Formato
```php
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die('Email inválido');
}
```

### 10. Configuración de Servidor

#### ✅ Nginx
```nginx
# No exponer versión
server_tokens off;

# Bloquear acceso a archivos sensibles
location ~ /\. { deny all; }
location ~ ~$ { deny all; }
```

## Checklist de Seguridad para Producción

- [ ] Instalar certificado HTTPS (Let's Encrypt)
- [ ] Cambiar todas las contraseñas por defecto
- [ ] Habilitar backups automáticos diarios
- [ ] Configurar firewall (UFW/iptables)
- [ ] Monitoreo 24/7 de logs
- [ ] Actualizar todos los paquetes
- [ ] Deshabilitar servicios innecesarios
- [ ] Configurar fail2ban para rate limiting
- [ ] Auditoría regular de permisos
- [ ] Rotate SSH keys y credenciales
- [ ] Implementar WAF (ModSecurity)
- [ ] Testing de penetración
- [ ] Plan de recuperación ante desastres

## Vulnerabilidades OWASP Top 10

### 1. Broken Access Control
✅ **Mitigado** - Validación de rol en cada acción

### 2. Cryptographic Failures
✅ **Mitigado** - HTTPS, bcrypt para contraseñas

### 3. Injection
✅ **Mitigado** - Prepared statements, validación entrada

### 4. Insecure Design
✅ **Mitigado** - Arquitectura segura desde inicio

### 5. Security Misconfiguration
✅ **Mitigado** - Headers HTTP, permisos restringidos

### 6. Vulnerable and Outdated Components
⚠️ **Requiere** - Monitoreo de dependencias

### 7. Authentication Failures
✅ **Mitigado** - Validación fuerte de contraseña

### 8. Software and Data Integrity Failures
✅ **Mitigado** - Checksum, auditoría

### 9. Logging and Monitoring Failures
✅ **Mitigado** - Sistema de auditoría implementado

### 10. SSRF
✅ **Mitigado** - Validación de URLs

## Scripts de Seguridad

### Verificación de Seguridad

```bash
./scripts/security-check.sh
```

### Auditoría de Permisos

```bash
# Ver permisos de archivos
ls -la app/public
ls -la app/src

# Archivos deben permitir lectura pero no escritura pública
# 755 para directorios
# 644 para archivos
```

## Guía de Credenciales Seguras

### Generar Contraseña Fuerte

```bash
# Usando OpenSSL
openssl rand -base64 32

# Usando /dev/urandom
head -c 32 /dev/urandom | base64
```

### Almacenar Secretos

**Usar variables de ambiente, nunca en código:**

```php
// ✅ CORRECTO
$db_pass = getenv('DB_PASS');

// ❌ INCORRECTO
$db_pass = 'contraseña123'; // En código
```

## Respuesta ante Incidentes

### Si sospechas de Breach

1. Cambiar todas las contraseñas
2. Revisar logs de auditoría (tabla `auditoria`)
3. Buscar actividad anómala
4. Hacer backup limpio
5. Restaurar desde backup conocido como seguro
6. Notificar a usuarios afectados

### Logs a Revisar

```sql
-- Auditoría de seguridad
SELECT * FROM auditoria 
WHERE fecha > DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY fecha DESC;

-- Intentos de login fallidos
SELECT * FROM auditoria 
WHERE accion = 'login_fallido'
GROUP BY ip_address
HAVING COUNT(*) > 5;
```

## Recursos Adicionales

- OWASP.org - Top 10 Security Risks
- CWE.mitre.org - Common Weakness Enumeration
- NIST.gov - Cybersecurity Framework
- PHP.net - Security Manual
- Mozilla - Web Security Guidelines

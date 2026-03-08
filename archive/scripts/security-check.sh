#!/bin/bash

# =============================================================================
# Script de Verificación de Seguridad
# =============================================================================

echo "========================================="
echo "🔒 Verificación de Seguridad"
echo "========================================="

echo ""
echo "1️⃣ Verificando permisos de archivos..."
docker-compose exec -T php find /app -type f -perm /077 -ls 2>/dev/null || echo "✓ Archivo permissions OK"

echo ""
echo "2️⃣ Verificando headers HTTP de seguridad..."
curl -I http://localhost 2>/dev/null | grep -E "X-Frame-Options|X-Content-Type-Options|X-XSS-Protection" || echo "⚠️ Headers de seguridad no verificados"

echo ""
echo "3️⃣ Verificando logs de errores..."
docker-compose logs php 2>&1 | grep -i "error\|warning" | tail -5 || echo "✓ No hay errores recientes"

echo ""
echo "4️⃣ Verificando conexión a base de datos..."
docker-compose exec -T php php -r "require '/app/src/config/Database.php'; use App\Config\Database; Database::getInstance(); echo '✓ Conexión OK';" || echo "❌ Error de conexión"

echo ""
echo "5️⃣ Verificando HTTPS..."
echo "⚠️ HTTPS no está configurado en desarrollo. Usar en producción con certificado Let's Encrypt"

echo ""
echo "========================================="
echo "✅ Verificación completada"
echo "========================================="

#!/bin/bash

# =============================================================================
# Script de Inicio del Proyecto - Deploy Local
# =============================================================================

set -e

echo "========================================="
echo "🚀 Iniciando Tienda Online"
echo "========================================="

# Verificar que Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

# Crear directorio de logs si no existe
mkdir -p logs

# Construir imagen
echo ""
echo "📦 Construyendo imagen Docker..."
docker-compose build

# Iniciar servicios
echo ""
echo "🔄 Iniciando servicios..."
docker-compose up -d

# Esperar a que MySQL esté listo
echo ""
echo "⏳ Esperando a que MySQL esté disponible..."
for i in {1..30}; do
    if docker-compose exec -T db mysqladmin ping -h localhost -u root -proot123 &> /dev/null; then
        echo "✓ MySQL está listo"
        break
    fi
    echo "  Intento $i/30..."
    sleep 1
done

# Dar permiso a directorios
echo ""
echo "🔐 Configurando permisos..."
docker-compose exec -T php chmod -R 755 /app/public
docker-compose exec -T php chmod -R 755 /app/logs

# Mostrar información
echo ""
echo "========================================="
echo "✅ ¡Tienda Online iniciada exitosamente!"
echo "========================================="
echo ""
echo "📍 Accede a: http://localhost"
echo ""
echo "🗄️  Base de datos: mysql://tienda_user:tienda_pass123@db:3306/tienda_db"
echo ""
echo "👤 Cuenta Admin:"
echo "   Email: admin@tienda.local"
echo "   Contraseña: Tienda123456"
echo ""
echo "👥 Cuenta Demo:"
echo "   Email: demo@tienda.local"
echo "   Contraseña: Tienda123456"
echo ""
echo "📊 Logs:"
echo "   docker-compose logs -f php"
echo "   docker-compose logs -f nginx"
echo ""
echo "⏹️  Para detener:"
echo "   docker-compose down"
echo ""

#!/bin/bash

# =============================================================================
# Script de Restauración de Backup
# =============================================================================

if [ $# -eq 0 ]; then
    echo "❌ Uso: ./restore.sh <archivo_backup.sql>.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Archivo no encontrado: $BACKUP_FILE"
    exit 1
fi

echo "========================================="
echo "📥 Restaurando base de datos"
echo "========================================="

# Si está comprimido, descomprimir temporalmente
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "🔓 Descomprimiendo..."
    gunzip -c "$BACKUP_FILE" | docker-compose exec -T db mysql -u tienda_user -ptienda_pass123 tienda_db
else
    cat "$BACKUP_FILE" | docker-compose exec -T db mysql -u tienda_user -ptienda_pass123 tienda_db
fi

if [ $? -eq 0 ]; then
    echo "✅ Restauración completada"
else
    echo "❌ Error durante la restauración"
    exit 1
fi

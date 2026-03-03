#!/bin/bash

# =============================================================================
# Script de Backup de Base de Datos
# =============================================================================

BACKUP_DIR="./backups"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$BACKUP_DATE.sql"

# Crear directorio si no existe
mkdir -p "$BACKUP_DIR"

echo "========================================="
echo "💾 Realizando backup de base de datos"
echo "========================================="

# Ejecutar mysqldump
docker-compose exec -T db mysqldump -u tienda_user -ptienda_pass123 tienda_db > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup completado: $BACKUP_FILE"
    
    # Comprimir
    gzip "$BACKUP_FILE"
    echo "✅ Backup comprimido: ${BACKUP_FILE}.gz"
    
    # Eliminar backups más antiguos de 7 días
    find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete
    echo "🧹 Limpieza de backups antiguos completada"
else
    echo "❌ Error al realizar backup"
    exit 1
fi

#!/bin/bash

# Script para detener todos los servicios
# Uso: ./stop.sh

echo "🛑 Deteniendo servicios..."
docker-compose down

echo "✅ Servicios detenidos"

#!/bin/bash

# Script para ver logs de un servicio en tiempo real
# Uso: ./logs.sh [servicio]
# Ejemplo: ./logs.sh api-gateway

if [ -z "$1" ]; then
    echo "Uso: ./logs.sh [servicio]"
    echo ""
    echo "Servicios disponibles:"
    echo "  - all (muestra logs de todos)"
    echo "  - api-gateway"
    echo "  - auth-service"
    echo "  - product-service"
    echo "  - order-service"
    echo "  - frontend"
    echo "  - mysql"
    exit 1
fi

if [ "$1" = "all" ]; then
    docker-compose logs -f
else
    docker-compose logs -f "$1"
fi

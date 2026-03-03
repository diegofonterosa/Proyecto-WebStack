#!/bin/bash

# Script de inicio rápido para Tienda Reactiva con Microservicios
# Uso: ./start.sh

set -e

echo "════════════════════════════════════════════════════════════"
echo "  🛍️  Tienda Reactiva - Microservicios"
echo "════════════════════════════════════════════════════════════"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Por favor, instala Docker primero."
    exit 1
fi

print_success "Docker encontrado"

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose no está instalado. Por favor, instala Docker Compose primero."
    exit 1
fi

print_success "Docker Compose encontrado"

echo ""
print_info "Verificando estructura del proyecto..."

# Verificar que exista docker-compose.yml
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml no encontrado. Asegúrate de ejecutar este script desde la raíz del proyecto."
    exit 1
fi

print_success "docker-compose.yml encontrado"

# Crear .env files si no existen
print_info "Configurando variables de entorno..."

if [ ! -f "microservices/api-gateway/.env" ]; then
    cp microservices/api-gateway/.env.example microservices/api-gateway/.env
    print_success "Creado .env para API Gateway"
fi

if [ ! -f "microservices/auth-service/.env" ]; then
    cp microservices/auth-service/.env.example microservices/auth-service/.env
    print_success "Creado .env para Auth Service"
fi

if [ ! -f "microservices/product-service/.env" ]; then
    cp microservices/product-service/.env.example microservices/product-service/.env
    print_success "Creado .env para Product Service"
fi

if [ ! -f "microservices/order-service/.env" ]; then
    cp microservices/order-service/.env.example microservices/order-service/.env
    print_success "Creado .env para Order Service"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    print_success "Creado .env para Frontend"
fi

echo ""
print_info "Construyendo e iniciando los servicios..."
echo "Esto puede tomar algunos minutos la primera vez..."
echo ""

# Construir e iniciar servicios
docker-compose up --build


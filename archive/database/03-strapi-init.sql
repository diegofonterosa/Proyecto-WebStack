-- Scripts para inicializar Strapi en MySQL
-- Este archivo se ejecuta automáticamente al iniciarse MySQL

-- Crear usuario para Strapi si no existe
CREATE USER IF NOT EXISTS 'strapi_user'@'%' IDENTIFIED BY 'strapi_pass';

-- Crear base de datos para Strapi
CREATE DATABASE IF NOT EXISTS strapi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Otorgar permisos completos
GRANT ALL PRIVILEGES ON strapi_db.* TO 'strapi_user'@'%';

-- Garantizar permisos al usuario de tienda
GRANT ALL PRIVILEGES ON tienda_db.* TO 'tienda_user'@'%';

-- Aplicar cambios
FLUSH PRIVILEGES;

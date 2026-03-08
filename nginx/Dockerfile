FROM php:8.2-fpm

# Instalar extensiones necesarias
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && docker-php-ext-install pdo pdo_mysql mysqli

# Configuración PHP para seguridad
RUN echo "disable_functions = exec,passthru,shell_exec,system,proc_open,popen,curl_exec,curl_multi_exec,parse_ini_file,show_source" >> /usr/local/etc/php/conf.d/security.ini

# Crear usuario www-data si no existe
RUN useradd -m -u 33 www-data || true

WORKDIR /app

EXPOSE 9000

CMD ["php-fpm"]

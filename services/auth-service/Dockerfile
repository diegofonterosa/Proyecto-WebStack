FROM php:8.1-fpm-alpine

RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /app

COPY src/ ./

EXPOSE 5001

CMD ["php", "-S", "0.0.0.0:5001", "-t", "/app"]

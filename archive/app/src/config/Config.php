<?php

namespace App\Config;

/**
 * Configuración global de la aplicación
 */
class Config
{
    // Configuración de base de datos
    public const DB_HOST = 'db';
    public const DB_NAME = 'tienda_db';
    public const DB_USER = 'tienda_user';
    public const DB_PASS = 'tienda_pass123';
    public const DB_PORT = 3306;

    // Configuración de seguridad
    public const SALT = 'tienda_local_2026_salt_secure';
    public const SESSION_TIMEOUT = 3600; // 1 hora
    public const MAX_LOGIN_ATTEMPTS = 5;
    public const LOCKOUT_TIME = 900; // 15 minutos

    // Configuración de sitio
    public const SITE_NAME = 'Tienda Online';
    public const SITE_URL = 'http://localhost';
    public const SITE_EMAIL = 'info@tienda.local';

    // Paginación
    public const ITEMS_PER_PAGE = 12;

    // Rutas
    public const UPLOAD_DIR = __DIR__ . '/../../public/uploads/';
    public const LOGS_DIR = __DIR__ . '/../../logs/';

    /**
     * Obtener variable de environment o valor por defecto
     */
    public static function get(string $key, string $default = ''): string
    {
        return getenv($key) ?: $default;
    }

    /**
     * Inicializar directorios necesarios
     */
    public static function initializeDirs(): void
    {
        $dirs = [self::UPLOAD_DIR, self::LOGS_DIR];
        foreach ($dirs as $dir) {
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
        }
    }
}

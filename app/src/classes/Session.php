<?php

namespace App\Classes;

use App\Config\Config;

/**
 * Clase para gestionar sesiones de usuario
 */
class Session
{
    private static bool $started = false;

    /**
     * Iniciar sesión
     */
    public static function start(): void
    {
        if (!self::$started) {
            // Configuración segura de sesión
            ini_set('session.cookie_httponly', 1);
            ini_set('session.cookie_secure', 0); // Cambiar a 1 en HTTPS
            ini_set('session.cookie_samesite', 'Lax');
            ini_set('session.use_strict_mode', 1);
            ini_set('session.gc_maxlifetime', Config::SESSION_TIMEOUT);

            session_start();
            self::$started = true;

            // Detectar fijación de sesión
            if (!isset($_SESSION['initialized'])) {
                session_regenerate_id(true);
                $_SESSION['initialized'] = true;
            }
        }
    }

    /**
     * Obtener valor de sesión
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        self::start();
        return $_SESSION[$key] ?? $default;
    }

    /**
     * Establecer valor de sesión
     */
    public static function set(string $key, mixed $value): void
    {
        self::start();
        $_SESSION[$key] = $value;
    }

    /**
     * Verificar si existe clave en sesión
     */
    public static function has(string $key): bool
    {
        self::start();
        return isset($_SESSION[$key]);
    }

    /**
     * Eliminar clave de sesión
     */
    public static function delete(string $key): void
    {
        self::start();
        unset($_SESSION[$key]);
    }

    /**
     * Obtener ID de usuario en sesión
     */
    public static function getUserId(): ?int
    {
        return self::get('user_id');
    }

    /**
     * Establecer usuario en sesión
     */
    public static function setUser(User $user): void
    {
        self::set('user_id', $user->getId());
        self::set('user_nombre', $user->getNombre());
        self::set('user_email', $user->getEmail());
        self::set('user_rol', $user->getRol());
    }

    /**
     * Obtener usuario de sesión
     */
    public static function getUser(): ?User
    {
        $userId = self::getUserId();
        if ($userId) {
            return User::findById($userId);
        }
        return null;
    }

    /**
     * Verificar si usuario está autenticado
     */
    public static function isAuthenticated(): bool
    {
        return self::getUserId() !== null;
    }

    /**
     * Verificar si usuario es admin
     */
    public static function isAdmin(): bool
    {
        return self::get('user_rol') === 'admin';
    }

    /**
     * Destruir sesión (logout)
     */
    public static function destroy(): void
    {
        self::start();
        $_SESSION = [];
        
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }

        session_destroy();
        self::$started = false;
    }

    /**
     * Agregar mensaje flash
     */
    public static function setFlash(string $tipo, string $mensaje): void
    {
        self::start();
        if (!isset($_SESSION['flash'])) {
            $_SESSION['flash'] = [];
        }
        $_SESSION['flash'][$tipo] = $mensaje;
    }

    /**
     * Obtener mensajes flash
     */
    public static function getFlash(string $tipo = ''): array|string|null
    {
        self::start();
        if (empty($tipo)) {
            $flash = $_SESSION['flash'] ?? [];
            unset($_SESSION['flash']);
            return $flash;
        }

        $mensaje = $_SESSION['flash'][$tipo] ?? null;
        unset($_SESSION['flash'][$tipo]);
        return $mensaje;
    }
}

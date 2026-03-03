<?php

namespace App\Classes;

use App\Config\Config;

/**
 * Clase para funciones de seguridad
 */
class Security
{
    /**
     * Escapar output para HTML
     */
    public static function escape(string $data): string
    {
        return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    }

    /**
     * Validar CSRF token
     */
    public static function validateCSRF(string $token): bool
    {
        Session::start();
        
        if (!isset($_SESSION['csrf_token'])) {
            return false;
        }

        return hash_equals($_SESSION['csrf_token'], $token);
    }

    /**
     * Generar CSRF token
     */
    public static function generateCSRFToken(): string
    {
        Session::start();

        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }

        return $_SESSION['csrf_token'];
    }

    /**
     * Obtener token CSRF como input HTML
     */
    public static function getCSRFInput(): string
    {
        $token = self::generateCSRFToken();
        return '<input type="hidden" name="csrf_token" value="' . self::escape($token) . '">';
    }

    /**
     * Validar email
     */
    public static function validateEmail(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Validar contraseña fuerte
     */
    public static function validatePassword(string $password): bool
    {
        // Mínimo 8 caracteres, 1 mayúscula, 1 número
        return preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/', $password);
    }

    /**
     * Sanitizar entrada
     */
    public static function sanitize(string $data): string
    {
        return trim(stripslashes($data));
    }

    /**
     * Validar número entero
     */
    public static function validateInt(mixed $data): ?int
    {
        $filtered = filter_var($data, FILTER_VALIDATE_INT);
        return $filtered !== false ? $filtered : null;
    }

    /**
     * Validar número flotante
     */
    public static function validateFloat(mixed $data): ?float
    {
        $filtered = filter_var($data, FILTER_VALIDATE_FLOAT);
        return $filtered !== false ? $filtered : null;
    }

    /**
     * Generar token de verificación
     */
    public static function generateVerificationToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Hash de contraseña
     */
    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    /**
     * Verificar contraseña
     */
    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * Obtener IP del cliente
     */
    public static function getClientIP(): string
    {
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
        } else {
            $ip = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
        }

        return self::escape(trim($ip));
    }

    /**
     * Registrar acción de seguridad
     */
    public static function logAction(string $accion, string $detalles = '', ?int $usuarioId = null): void
    {
        $db = \App\Config\Database::getInstance();
        $ip = self::getClientIP();
        
        $sql = "INSERT INTO auditoria (usuario_id, accion, detalles, ip_address) VALUES (?, ?, ?, ?)";
        $db->execute($sql, [$usuarioId, $accion, $detalles, $ip]);
    }

    /**
     * Validar autorización
     */
    public static function requireAuth(): void
    {
        if (!Session::isAuthenticated()) {
            Session::setFlash('error', 'Debes iniciar sesión');
            header('Location: /login');
            exit;
        }
    }

    /**
     * Validar autorización de admin
     */
    public static function requireAdmin(): void
    {
        if (!Session::isAdmin()) {
            Session::setFlash('error', 'Acceso denegado');
            header('Location: /');
            exit;
        }
    }

    /**
     * Proteger contra XSS
     */
    public static function sanitizeOutput(mixed $data): string
    {
        if (is_array($data)) {
            return self::escape(json_encode($data));
        }
        return self::escape((string)$data);
    }
}

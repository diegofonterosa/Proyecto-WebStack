<?php

namespace App\Classes;

use App\Config\Database;
use App\Config\Config;

/**
 * Clase para gestionar usuarios
 */
class User
{
    private int $id;
    private string $nombre;
    private string $email;
    private string $rol;
    private bool $activo;
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Registrar nuevo usuario
     */
    public static function register(string $nombre, string $email, string $contraseña): bool
    {
        $db = Database::getInstance();

        // Validar email único
        $existe = $db->queryOne("SELECT id FROM usuarios WHERE email = ?", [$email]);
        if ($existe) {
            return false; // Email ya existe
        }

        // Hash de contraseña con bcrypt
        $hash = password_hash($contraseña, PASSWORD_BCRYPT, ['cost' => 12]);

        $sql = "INSERT INTO usuarios (nombre, email, contraseña, rol) VALUES (?, ?, ?, 'cliente')";
        return $db->execute($sql, [$nombre, $email, $hash]) > 0;
    }

    /**
     * Login de usuario
     */
    public static function login(string $email, string $contraseña): ?User
    {
        $db = Database::getInstance();

        $sql = "SELECT id, nombre, email, contraseña, rol, activo FROM usuarios WHERE email = ? AND activo = 1";
        $userData = $db->queryOne($sql, [$email]);

        if (!$userData) {
            return null;
        }

        // Verificar contraseña
        if (!password_verify($contraseña, $userData['contraseña'])) {
            return null;
        }

        // Crear instancia y cargar datos
        $user = new User();
        $user->id = $userData['id'];
        $user->nombre = $userData['nombre'];
        $user->email = $userData['email'];
        $user->rol = $userData['rol'];
        $user->activo = (bool)$userData['activo'];

        return $user;
    }

    /**
     * Buscar usuario por ID
     */
    public static function findById(int $id): ?User
    {
        $db = Database::getInstance();

        $sql = "SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ?";
        $userData = $db->queryOne($sql, [$id]);

        if (!$userData) {
            return null;
        }

        $user = new User();
        $user->id = $userData['id'];
        $user->nombre = $userData['nombre'];
        $user->email = $userData['email'];
        $user->rol = $userData['rol'];
        $user->activo = (bool)$userData['activo'];

        return $user;
    }

    /**
     * Cambiar contraseña
     */
    public function changePassword(string $nuevaContraseña): bool
    {
        $hash = password_hash($nuevaContraseña, PASSWORD_BCRYPT, ['cost' => 12]);
        $sql = "UPDATE usuarios SET contraseña = ? WHERE id = ?";
        return $this->db->execute($sql, [$hash, $this->id]) > 0;
    }

    // Getters
    public function getId(): int { return $this->id; }
    public function getNombre(): string { return $this->nombre; }
    public function getEmail(): string { return $this->email; }
    public function getRol(): string { return $this->rol; }
    public function isActivo(): bool { return $this->activo; }
    public function isAdmin(): bool { return $this->rol === 'admin'; }
}

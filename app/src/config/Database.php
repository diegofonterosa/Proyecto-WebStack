<?php

namespace App\Config;

use PDO;
use PDOException;

/**
 * Clase para gestionar la conexión a la base de datos MySQL
 * Implementa el patrón Singleton para asegurar una única conexión
 */
class Database
{
    private static ?Database $instance = null;
    private ?PDO $connection = null;

    private string $host;
    private string $db;
    private string $user;
    private string $pass;
    private int $port;

    /**
     * Constructor privado - usar getInstance()
     */
    private function __construct()
    {
        $this->host = getenv('DB_HOST') ?: 'localhost';
        $this->db = getenv('DB_NAME') ?: 'tienda_db';
        $this->user = getenv('DB_USER') ?: 'tienda_user';
        $this->pass = getenv('DB_PASS') ?: 'tienda_pass123';
        $this->port = (int)(getenv('DB_PORT') ?: 3306);

        $this->connect();
    }

    /**
     * Obtener instancia singleton
     */
    public static function getInstance(): Database
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Establecer conexión a la base de datos
     */
    private function connect(): void
    {
        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db};charset=utf8mb4";
            
            $this->connection = new PDO($dsn, $this->user, $this->pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            
            error_log("✓ Conexión a BD exitosa");
        } catch (PDOException $e) {
            error_log("✗ Error conexión BD: " . $e->getMessage());
            throw new PDOException("Error al conectar con la base de datos");
        }
    }

    /**
     * Obtener conexión PDO
     */
    public function getConnection(): PDO
    {
        if ($this->connection === null) {
            $this->connect();
        }
        return $this->connection;
    }

    /**
     * Ejecutar consulta preparada
     */
    public function query(string $sql, array $params = []): array
    {
        try {
            $stmt = $this->getConnection()->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log("Error en query: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Ejecutar consulta que retorna una fila
     */
    public function queryOne(string $sql, array $params = []): ?array
    {
        try {
            $stmt = $this->getConnection()->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch() ?: null;
        } catch (PDOException $e) {
            error_log("Error en queryOne: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Ejecutar comando INSERT/UPDATE/DELETE
     */
    public function execute(string $sql, array $params = []): int
    {
        try {
            $stmt = $this->getConnection()->prepare($sql);
            $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            error_log("Error en execute: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Obtener el ID del último insert
     */
    public function lastInsertId(): string
    {
        return $this->getConnection()->lastInsertId();
    }

    /**
     * Iniciar transacción
     */
    public function beginTransaction(): void
    {
        $this->getConnection()->beginTransaction();
    }

    /**
     * Confirmar transacción
     */
    public function commit(): void
    {
        $this->getConnection()->commit();
    }

    /**
     * Revertir transacción
     */
    public function rollback(): void
    {
        $this->getConnection()->rollBack();
    }

    /**
     * Cerrar conexión
     */
    public function __destruct()
    {
        $this->connection = null;
    }
}

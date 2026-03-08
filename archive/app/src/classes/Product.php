<?php

namespace App\Classes;

use App\Config\Database;
use App\Config\Config;

/**
 * Clase para gestionar productos
 */
class Product
{
    private int $id;
    private string $nombre;
    private string $descripcion;
    private float $precio;
    private int $stock;
    private string $categoria;
    private string $imagenUrl;
    private bool $activo;
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Obtener todos los productos activos
     */
    public static function getAll(int $page = 1): array
    {
        $db = Database::getInstance();
        $limit = Config::ITEMS_PER_PAGE;
        $offset = ($page - 1) * $limit;

        $sql = "SELECT * FROM productos WHERE activo = 1 ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?";
        return $db->query($sql, [$limit, $offset]);
    }

    /**
     * Obtener total de productos
     */
    public static function getTotalCount(): int
    {
        $db = Database::getInstance();
        $result = $db->queryOne("SELECT COUNT(*) as total FROM productos WHERE activo = 1");
        return $result['total'] ?? 0;
    }

    /**
     * Buscar productos por término
     */
    public static function search(string $termino, int $page = 1): array
    {
        $db = Database::getInstance();
        $limit = Config::ITEMS_PER_PAGE;
        $offset = ($page - 1) * $limit;

        // Usar búsqueda fulltext para mejor rendimiento
        $sql = "SELECT * FROM productos 
                WHERE activo = 1 AND (
                    MATCH(nombre, descripcion) AGAINST(? IN BOOLEAN MODE)
                    OR nombre LIKE ?
                    OR categoria LIKE ?
                )
                ORDER BY fecha_creacion DESC
                LIMIT ? OFFSET ?";

        $busqueda = "%{$termino}%";
        return $db->query($sql, [$termino, $busqueda, $busqueda, $limit, $offset]);
    }

    /**
     * Filtrar por categoría
     */
    public static function getByCategory(string $categoria, int $page = 1): array
    {
        $db = Database::getInstance();
        $limit = Config::ITEMS_PER_PAGE;
        $offset = ($page - 1) * $limit;

        $sql = "SELECT * FROM productos 
                WHERE activo = 1 AND categoria = ? 
                ORDER BY precio ASC
                LIMIT ? OFFSET ?";

        return $db->query($sql, [$categoria, $limit, $offset]);
    }

    /**
     * Obtener producto por ID
     */
    public static function findById(int $id): ?Product
    {
        $db = Database::getInstance();

        $sql = "SELECT * FROM productos WHERE id = ? AND activo = 1";
        $data = $db->queryOne($sql, [$id]);

        if (!$data) {
            return null;
        }

        $product = new Product();
        $product->id = $data['id'];
        $product->nombre = $data['nombre'];
        $product->descripcion = $data['descripcion'];
        $product->precio = (float)$data['precio'];
        $product->stock = (int)$data['stock'];
        $product->categoria = $data['categoria'];
        $product->imagenUrl = $data['imagen_url'];
        $product->activo = (bool)$data['activo'];

        return $product;
    }

    /**
     * Obtener categorías únicas
     */
    public static function getCategories(): array
    {
        $db = Database::getInstance();
        $sql = "SELECT DISTINCT categoria FROM productos WHERE activo = 1 AND categoria IS NOT NULL ORDER BY categoria";
        $results = $db->query($sql);

        return array_column($results, 'categoria');
    }

    /**
     * Crear nuevo producto (solo admin)
     */
    public static function create(array $datos): bool
    {
        $db = Database::getInstance();

        $sql = "INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url) 
                VALUES (?, ?, ?, ?, ?, ?)";

        return $db->execute($sql, [
            $datos['nombre'],
            $datos['descripcion'],
            $datos['precio'],
            $datos['stock'],
            $datos['categoria'],
            $datos['imagen_url'] ?? null
        ]) > 0;
    }

    /**
     * Actualizar stock
     */
    public function decreaseStock(int $cantidad): bool
    {
        if ($cantidad > $this->stock) {
            return false; // Stock insuficiente
        }

        $sql = "UPDATE productos SET stock = stock - ? WHERE id = ?";
        return $this->db->execute($sql, [$cantidad, $this->id]) > 0;
    }

    /**
     * Actualizar producto
     */
    public function update(array $datos): bool
    {
        $campos = [];
        $valores = [];

        foreach ($datos as $campo => $valor) {
            if (in_array($campo, ['nombre', 'descripcion', 'precio', 'stock', 'categoria'])) {
                $campos[] = "$campo = ?";
                $valores[] = $valor;
            }
        }

        if (empty($campos)) {
            return false;
        }

        $valores[] = $this->id;
        $sql = "UPDATE productos SET " . implode(", ", $campos) . " WHERE id = ?";

        return $this->db->execute($sql, $valores) > 0;
    }

    // Getters
    public function getId(): int { return $this->id; }
    public function getNombre(): string { return $this->nombre; }
    public function getDescripcion(): string { return $this->descripcion; }
    public function getPrecio(): float { return $this->precio; }
    public function getStock(): int { return $this->stock; }
    public function getCategoria(): string { return $this->categoria; }
    public function getImagenUrl(): string { return $this->imagenUrl; }
    public function isActivo(): bool { return $this->activo; }
    public function hasStock(): bool { return $this->stock > 0; }
}

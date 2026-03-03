<?php

namespace App\Classes;

use App\Config\Database;

/**
 * Clase para gestionar el carrito de compras
 */
class Cart
{
    private int $usuarioId;
    private Database $db;

    public function __construct(int $usuarioId)
    {
        $this->usuarioId = $usuarioId;
        $this->db = Database::getInstance();
    }

    /**
     * Agregar producto al carrito
     */
    public function addProduct(int $productoId, int $cantidad = 1): bool
    {
        $product = Product::findById($productoId);
        if (!$product) {
            return false;
        }

        // Verificar si producto ya está en carrito
        $sql = "SELECT id, cantidad FROM carrito WHERE usuario_id = ? AND producto_id = ?";
        $existing = $this->db->queryOne($sql, [$this->usuarioId, $productoId]);

        if ($existing) {
            // Actualizar cantidad
            $nuevaCantidad = $existing['cantidad'] + $cantidad;
            $sql = "UPDATE carrito SET cantidad = ? WHERE id = ?";
            return $this->db->execute($sql, [$nuevaCantidad, $existing['id']]) > 0;
        } else {
            // Insertar nuevo
            $sql = "INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)";
            return $this->db->execute($sql, [$this->usuarioId, $productoId, $cantidad]) > 0;
        }
    }

    /**
     * Obtener carrito con detalles de productos
     */
    public function getItems(): array
    {
        $sql = "SELECT c.id, c.cantidad, p.id as producto_id, p.nombre, p.precio, p.stock, p.imagen_url
                FROM carrito c
                JOIN productos p ON c.producto_id = p.id
                WHERE c.usuario_id = ?
                ORDER BY c.fecha_agregado DESC";

        return $this->db->query($sql, [$this->usuarioId]);
    }

    /**
     * Obtener total del carrito
     */
    public function getTotal(): float
    {
        $items = $this->getItems();
        $total = 0;

        foreach ($items as $item) {
            $total += $item['precio'] * $item['cantidad'];
        }

        return round($total, 2);
    }

    /**
     * Obtener cantidad de items
     */
    public function getItemCount(): int
    {
        $sql = "SELECT SUM(cantidad) as total FROM carrito WHERE usuario_id = ?";
        $result = $this->db->queryOne($sql, [$this->usuarioId]);
        return (int)($result['total'] ?? 0);
    }

    /**
     * Actualizar cantidad de producto
     */
    public function updateQuantity(int $carritoId, int $cantidad): bool
    {
        if ($cantidad <= 0) {
            return $this->removeItem($carritoId);
        }

        $sql = "UPDATE carrito SET cantidad = ? WHERE id = ? AND usuario_id = ?";
        return $this->db->execute($sql, [$cantidad, $carritoId, $this->usuarioId]) > 0;
    }

    /**
     * Eliminar producto del carrito
     */
    public function removeItem(int $carritoId): bool
    {
        $sql = "DELETE FROM carrito WHERE id = ? AND usuario_id = ?";
        return $this->db->execute($sql, [$carritoId, $this->usuarioId]) > 0;
    }

    /**
     * Vaciar carrito
     */
    public function clear(): bool
    {
        $sql = "DELETE FROM carrito WHERE usuario_id = ?";
        return $this->db->execute($sql, [$this->usuarioId]) > 0;
    }

    /**
     * Crear pedido desde carrito
     */
    public function checkout(): ?int
    {
        $items = $this->getItems();

        if (empty($items)) {
            return null; // Carrito vacío
        }

        try {
            $this->db->beginTransaction();

            $total = $this->getTotal();

            // Crear pedido
            $sql = "INSERT INTO pedidos (usuario_id, total) VALUES (?, ?)";
            $this->db->execute($sql, [$this->usuarioId, $total]);
            $pedidoId = (int)$this->db->lastInsertId();

            // Agregar detalles del pedido y actualizar stock
            foreach ($items as $item) {
                $sqlDetalle = "INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario) 
                              VALUES (?, ?, ?, ?)";
                $this->db->execute($sqlDetalle, [
                    $pedidoId,
                    $item['producto_id'],
                    $item['cantidad'],
                    $item['precio']
                ]);

                // Actualizar stock
                $sqlStock = "UPDATE productos SET stock = stock - ? WHERE id = ?";
                $this->db->execute($sqlStock, [$item['cantidad'], $item['producto_id']]);
            }

            // Vaciar carrito
            $this->clear();

            $this->db->commit();

            return $pedidoId;
        } catch (\Exception $e) {
            $this->db->rollback();
            error_log("Error en checkout: " . $e->getMessage());
            return null;
        }
    }
}

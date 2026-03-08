<?php
/**
 * MICROSERVICIO DE PEDIDOS Y CARRITO
 * Puerto: 5003
 * Responsabilidades: Carrito, Pedidos, Checkout
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../database/db.php';

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/services/order-service/src', '', $path);
$path = str_replace('/api', '', $path);
$method = $_SERVER['REQUEST_METHOD'];

// Verificar autenticación
$header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = str_replace('Bearer ', '', $header);
$usuarioId = null;

if ($token) {
    try {
        $payload = json_decode(base64_decode(explode('.', $token)[1]), true);
        $usuarioId = $payload['sub'] ?? null;
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => 'Token inválido']);
        exit;
    }
}

try {
    $pdo = getDatabase();

    // POST /carrito/agregar
    if ($path === '/carrito/agregar' && $method === 'POST') {
        if (!$usuarioId) throw new Exception('No autenticado', 401);

        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['producto_id']) || !isset($input['cantidad'])) {
            throw new Exception('Parámetros requeridos', 400);
        }

        // Verificar stock
        $prod = $pdo->query("SELECT stock FROM productos WHERE id = {$input['producto_id']}")->fetch();
        if (!$prod || $prod['stock'] < $input['cantidad']) {
            throw new Exception('Stock insuficiente', 400);
        }

        // Agregar/actualizar carrito
        $stmt = $pdo->prepare('
            INSERT INTO carrito (usuario_id, producto_id, cantidad) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE cantidad = cantidad + ?
        ');
        $stmt->execute([$usuarioId, $input['producto_id'], $input['cantidad'], $input['cantidad']]);

        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Producto agregado']);
        exit;
    }

    // GET /carrito
    if ($path === '/carrito' && $method === 'GET') {
        if (!$usuarioId) throw new Exception('No autenticado', 401);

        $stmt = $pdo->prepare('
            SELECT c.id, c.cantidad, p.id as producto_id, p.nombre, 
                   p.precio, p.stock, p.imagen_url
            FROM carrito c
            JOIN productos p ON c.producto_id = p.id
            WHERE c.usuario_id = ?
        ');
        $stmt->execute([$usuarioId]);
        $items = $stmt->fetchAll();

        $total = array_sum(array_map(fn($item) => $item['precio'] * $item['cantidad'], $items));

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'items' => $items,
            'total' => round($total, 2)
        ]);
        exit;
    }

    // POST /pedidos/crear
    if ($path === '/pedidos/crear' && $method === 'POST') {
        if (!$usuarioId) throw new Exception('No autenticado', 401);

        try {
            $pdo->beginTransaction();

            // Obtener carrito
            $stmt = $pdo->prepare('
                SELECT c.id, c.cantidad, p.id as producto_id, p.precio, p.stock
                FROM carrito c
                JOIN productos p ON c.producto_id = p.id
                WHERE c.usuario_id = ?
            ');
            $stmt->execute([$usuarioId]);
            $items = $stmt->fetchAll();

            if (empty($items)) {
                throw new Exception('Carrito vacío', 400);
            }

            // Calcular total y validar stock
            $total = 0;
            foreach ($items as $item) {
                if ($item['stock'] < $item['cantidad']) {
                    throw new Exception('Stock insuficiente para ' . $item['producto_id']);
                }
                $total += $item['precio'] * $item['cantidad'];
            }

            // Crear pedido
            $stmt = $pdo->prepare('INSERT INTO pedidos (usuario_id, total) VALUES (?, ?)');
            $stmt->execute([$usuarioId, $total]);
            $pedidoId = $pdo->lastInsertId();

            // Agregar detalles y actualizar stock
            foreach ($items as $item) {
                $stmt = $pdo->prepare('
                    INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario)
                    VALUES (?, ?, ?, ?)
                ');
                $stmt->execute([$pedidoId, $item['producto_id'], $item['cantidad'], $item['precio']]);

                $updateStmt = $pdo->prepare('UPDATE productos SET stock = stock - ? WHERE id = ?');
                $updateStmt->execute([$item['cantidad'], $item['producto_id']]);
            }

            // Limpiar carrito
            $pdo->prepare('DELETE FROM carrito WHERE usuario_id = ?')->execute([$usuarioId]);

            $pdo->commit();

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'pedido_id' => $pedidoId,
                'total' => round($total, 2)
            ]);
            exit;

        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    // GET /pedidos
    if ($path === '/pedidos' && $method === 'GET') {
        if (!$usuarioId) throw new Exception('No autenticado', 401);

        $stmt = $pdo->prepare('
            SELECT id, total, estado, fecha_pedido 
            FROM pedidos 
            WHERE usuario_id = ? 
            ORDER BY fecha_pedido DESC
            LIMIT 10
        ');
        $stmt->execute([$usuarioId]);
        $pedidos = $stmt->fetchAll();

        http_response_code(200);
        echo json_encode(['success' => true, 'datos' => $pedidos]);
        exit;
    }

    // GET /health
    if ($path === '/health' && $method === 'GET') {
        http_response_code(200);
        echo json_encode(['status' => 'Order Service is running']);
        exit;
    }

    throw new Exception('Ruta no encontrada', 404);

} catch (Exception $e) {
    $code = $e->getCode() ?: 500;
    http_response_code($code);
    echo json_encode([
        'error' => $e->getMessage(),
        'code' => $code
    ]);
}

function getDatabase() {
    $host = getenv('DB_HOST') ?: 'mysql';
    $user = getenv('DB_USER') ?: 'tienda_user';
    $pass = getenv('DB_PASS') ?: 'tienda_pass123';
    $name = getenv('DB_NAME') ?: 'tienda_db';
    
    return new PDO("mysql:host=$host;dbname=$name", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
}

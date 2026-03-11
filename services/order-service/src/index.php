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

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/services/order-service/src', '', $path);
$path = str_replace('/api', '', $path);
$path = rtrim($path, '/');
$path = $path === '' ? '/' : $path;
$method = $_SERVER['REQUEST_METHOD'];

// Verificar autenticación
$header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = str_replace('Bearer ', '', $header);
$usuarioId = null;

if ($token) {
    try {
        $payload = verificarJWT($token);
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
        if (!is_array($input)) {
            throw new Exception('Payload inválido', 400);
        }
        
        if (!isset($input['producto_id']) || !isset($input['cantidad'])) {
            throw new Exception('Parámetros requeridos', 400);
        }

        $productoId = (int)$input['producto_id'];
        $cantidad = (int)$input['cantidad'];

        if ($productoId <= 0 || $cantidad <= 0) {
            throw new Exception('Parámetros inválidos', 400);
        }

        // Verificar stock
        $stockStmt = $pdo->prepare('SELECT stock FROM productos WHERE id = ?');
        $stockStmt->execute([$productoId]);
        $prod = $stockStmt->fetch();
        if (!$prod || $prod['stock'] < $cantidad) {
            throw new Exception('Stock insuficiente', 400);
        }

        // Agregar/actualizar carrito
        $stmt = $pdo->prepare('
            INSERT INTO carrito (usuario_id, producto_id, cantidad) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE cantidad = cantidad + ?
        ');
        $stmt->execute([$usuarioId, $productoId, $cantidad, $cantidad]);

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
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
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

    // PUT /carrito/:id  — actualizar cantidad de un ítem
    if (preg_match('/^\/carrito\/(\d+)$/', $path, $m) && $method === 'PUT') {
        if (!$usuarioId) throw new Exception('No autenticado', 401);

        $itemId = (int)$m[1];
        $input = json_decode(file_get_contents('php://input'), true);

        if (!is_array($input) || !isset($input['cantidad']) || (int)$input['cantidad'] < 1) {
            throw new Exception('Cantidad inválida', 400);
        }
        $cantidad = (int)$input['cantidad'];

        // Verificar que el ítem pertenece al usuario y hay stock suficiente
        $stmt = $pdo->prepare('
            SELECT p.stock FROM carrito c
            JOIN productos p ON c.producto_id = p.id
            WHERE c.id = ? AND c.usuario_id = ?
        ');
        $stmt->execute([$itemId, $usuarioId]);
        $row = $stmt->fetch();

        if (!$row) throw new Exception('Ítem no encontrado', 404);
        if ($row['stock'] < $cantidad) throw new Exception('Stock insuficiente', 400);

        $pdo->prepare('UPDATE carrito SET cantidad = ? WHERE id = ? AND usuario_id = ?')
            ->execute([$cantidad, $itemId, $usuarioId]);

        http_response_code(200);
        echo json_encode(['success' => true]);
        exit;
    }

    // DELETE /carrito/:id  — eliminar un ítem del carrito
    if (preg_match('/^\/carrito\/(\d+)$/', $path, $m) && $method === 'DELETE') {
        if (!$usuarioId) throw new Exception('No autenticado', 401);

        $itemId = (int)$m[1];
        $stmt = $pdo->prepare('DELETE FROM carrito WHERE id = ? AND usuario_id = ?');
        $stmt->execute([$itemId, $usuarioId]);

        if ($stmt->rowCount() === 0) throw new Exception('Ítem no encontrado', 404);

        http_response_code(200);
        echo json_encode(['success' => true]);
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
    $code = (int)$e->getCode();
    if ($code < 100 || $code > 599) {
        $code = 500;
    }
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

function verificarJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        throw new Exception('Token inválido', 401);
    }

    [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;
    $secret = getenv('JWT_SECRET') ?: 'secret';

    $expectedRaw = hash_hmac('sha256', $encodedHeader . '.' . $encodedPayload, $secret, true);
    $signatureRaw = base64UrlDecode($encodedSignature);

    if ($signatureRaw === false || !hash_equals($expectedRaw, $signatureRaw)) {
        throw new Exception('Token inválido', 401);
    }

    $payloadJson = base64UrlDecode($encodedPayload);
    if ($payloadJson === false) {
        throw new Exception('Token inválido', 401);
    }

    $payload = json_decode($payloadJson, true);
    if (!is_array($payload)) {
        throw new Exception('Token inválido', 401);
    }

    if (!isset($payload['exp']) || $payload['exp'] < time()) {
        throw new Exception('Token expirado', 401);
    }

    return $payload;
}

function base64UrlDecode($input) {
    $remainder = strlen($input) % 4;
    if ($remainder > 0) {
        $input .= str_repeat('=', 4 - $remainder);
    }

    $decoded = base64_decode(strtr($input, '-_', '+/'), true);
    if ($decoded === false) {
        $decoded = base64_decode($input, true);
    }

    return $decoded;
}

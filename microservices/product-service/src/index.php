<?php
/**
 * MICROSERVICIO DE PRODUCTOS
 * Puerto: 5002
 * Responsabilidades: Catálogo, Búsqueda, Filtros
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
$path = str_replace('/microservices/product-service/src', '', $path);
$path = str_replace('/api', '', $path);
$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getDatabase();

    // GET /productos - Listar con paginación
    if ($path === '/productos' && $method === 'GET') {
        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 12);
        $offset = ($page - 1) * $limit;

        $stmt = $pdo->prepare('
            SELECT id, nombre, descripcion, precio, stock, categoria, imagen_url
            FROM productos 
            WHERE activo = 1 
            ORDER BY fecha_creacion DESC 
            LIMIT ? OFFSET ?
        ');
        $stmt->execute([$limit, $offset]);
        $productos = $stmt->fetchAll();

        $countStmt = $pdo->query('SELECT COUNT(*) as total FROM productos WHERE activo = 1');
        $total = $countStmt->fetch()['total'];

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'datos' => $productos,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
        exit;
    }

    // GET /productos/:id - Detalle
    if (preg_match('#^/productos/(\d+)$#', $path, $matches) && $method === 'GET') {
        $stmt = $pdo->prepare('SELECT * FROM productos WHERE id = ? AND activo = 1');
        $stmt->execute([$matches[1]]);
        $producto = $stmt->fetch();

        if (!$producto) {
            throw new Exception('Producto no encontrado', 404);
        }

        http_response_code(200);
        echo json_encode(['success' => true, 'datos' => $producto]);
        exit;
    }

    // GET /productos/search - Búsqueda
    if ($path === '/productos/search' && $method === 'GET') {
        $q = $_GET['q'] ?? '';
        $categoria = $_GET['categoria'] ?? '';

        $sql = 'SELECT * FROM productos WHERE activo = 1';
        $params = [];

        if (!empty($q)) {
            $sql .= ' AND (MATCH(nombre, descripcion) AGAINST(? IN BOOLEAN MODE) OR nombre LIKE ?)';
            $params[] = $q;
            $params[] = "%$q%";
        }

        if (!empty($categoria)) {
            $sql .= ' AND categoria = ?';
            $params[] = $categoria;
        }

        $sql .= ' LIMIT 50';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $productos = $stmt->fetchAll();

        http_response_code(200);
        echo json_encode(['success' => true, 'datos' => $productos]);
        exit;
    }

    // GET /categorias - Listado de categorías
    if ($path === '/categorias' && $method === 'GET') {
        $stmt = $pdo->query('SELECT DISTINCT categoria FROM productos WHERE activo = 1 AND categoria IS NOT NULL');
        $categorias = $stmt->fetchAll();

        http_response_code(200);
        echo json_encode(['success' => true, 'datos' => $categorias]);
        exit;
    }

    // GET /health
    if ($path === '/health' && $method === 'GET') {
        http_response_code(200);
        echo json_encode(['status' => 'Product Service is running']);
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

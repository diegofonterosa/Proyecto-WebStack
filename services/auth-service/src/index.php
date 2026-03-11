<?php
/**
 * MICROSERVICIO DE AUTENTICACIÓN
 * Puerto: 5001
 * Responsabilidades: Login, Registro, JWT Tokens
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Obtener ruta solicitada
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/services/auth-service/src', '', $path);
$path = str_replace('/api', '', $path);
$path = rtrim($path, '/');
$path = $path === '' ? '/' : $path;
$method = $_SERVER['REQUEST_METHOD'];

// RUTAS
try {
    // POST /login
    if ($path === '/login' && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $password = $input['contrasena'] ?? ($input['contraseña'] ?? null);
        
        if (!isset($input['email']) || !$password) {
            throw new Exception('Email y contraseña requeridos', 400);
        }

        $pdo = getDatabase();
        $stmt = $pdo->prepare('SELECT id, nombre, email, contrasena, rol FROM usuarios WHERE email = ?');
        $stmt->execute([$input['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($password, $user['contrasena'])) {
            throw new Exception('Credenciales inválidas', 401);
        }

        // Generar JWT
        $token = generarJWT($user['id'], $user['email'], $user['rol']);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'token' => $token,
            'usuario' => [
                'id' => $user['id'],
                'nombre' => $user['nombre'],
                'email' => $user['email'],
                'rol' => $user['rol']
            ]
        ]);
        exit;
    }

    // POST /register
    if ($path === '/register' && $method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $password = $input['contrasena'] ?? ($input['contraseña'] ?? null);

        if (!isset($input['nombre']) || !isset($input['email']) || !$password) {
            throw new Exception('Faltan campos requeridos', 400);
        }

        if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Email inválido', 400);
        }

        $pdo = getDatabase();
        
        // Verificar si existe
        $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
        $stmt->execute([$input['email']]);
        if ($stmt->fetch()) {
            throw new Exception('Email ya registrado', 409);
        }

        // Crear usuario
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $stmt = $pdo->prepare('INSERT INTO usuarios (nombre, email, contrasena, rol) VALUES (?, ?, ?, ?)');
        $stmt->execute([$input['nombre'], $input['email'], $hash, 'cliente']);

        $userId = $pdo->lastInsertId();
        $token = generarJWT($userId, $input['email'], 'cliente');

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Usuario registrado exitosamente',
            'token' => $token,
            'usuario' => [
                'id' => $userId,
                'nombre' => $input['nombre'],
                'email' => $input['email'],
                'rol' => 'cliente'
            ]
        ]);
        exit;
    }

    // GET /verify
    if ($path === '/verify' && $method === 'GET') {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $token = str_replace('Bearer ', '', $header);

        if (!$token) {
            throw new Exception('Token no proporcionado', 401);
        }

        $decoded = verificarJWT($token);
        http_response_code(200);
        echo json_encode([
            'valid' => true,
            'usuario' => $decoded
        ]);
        exit;
    }

    // GET /health
    if ($path === '/health' && $method === 'GET') {
        http_response_code(200);
        echo json_encode(['status' => 'Auth Service is running']);
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

// FUNCIONES
function generarJWT($userId, $email, $rol) {
    $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64_encode(json_encode([
        'sub' => $userId,
        'email' => $email,
        'rol' => $rol,
        'iat' => time(),
        'exp' => time() + 86400 // 24 horas
    ]));
    
    $secret = getenv('JWT_SECRET') ?: 'secret';
    $signature = base64_encode(hash_hmac('sha256', $header . '.' . $payload, $secret, true));
    
    return $header . '.' . $payload . '.' . $signature;
}

function verificarJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        throw new Exception('Token inválido', 401);
    }

    $payload = json_decode(base64_decode($parts[1]), true);
    
    if ($payload['exp'] < time()) {
        throw new Exception('Token expirado', 401);
    }

    return $payload;
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

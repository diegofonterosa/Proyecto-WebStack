<?php
/**
 * Punto de entrada principal de la aplicación
 * Archivo: public/index.php
 * 
 * Maneja el ruteo de peticiones HTTP
 */

error_reporting(E_ALL);
ini_set('display_errors', 0); // No mostrar errores en producción
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/php_errors.log');

// Autoload de clases
require_once __DIR__ . '/../src/config/Config.php';
require_once __DIR__ . '/../src/config/Database.php';
require_once __DIR__ . '/../src/classes/Session.php';
require_once __DIR__ . '/../src/classes/Security.php';
require_once __DIR__ . '/../src/classes/User.php';
require_once __DIR__ . '/../src/classes/Product.php';
require_once __DIR__ . '/../src/classes/Cart.php';

use App\Config\Config;
use App\Config\Database;
use App\Classes\Session;
use App\Classes\Security;
use App\Classes\User;
use App\Classes\Product;
use App\Classes\Cart;

// Inicializar
Config::initializeDirs();
Session::start();

// Set headers de seguridad
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');

// Obtener ruta solicitada
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$request_method = $_SERVER['REQUEST_METHOD'];

// Remover /app si existe (para Docker)
$request_uri = str_replace('/app', '', $request_uri);

// Limpiar barra final
$request_uri = rtrim($request_uri, '/') ?: '/';

// Obtener usuario actual
$usuario = Session::getUser();

// RUTEO
if ($request_uri === '/') {
    // PÁGINA PRINCIPAL
    $page = (int)($_GET['page'] ?? 1);
    $page = max(1, $page);

    $productos = Product::getAll($page);
    $total = Product::getTotalCount();
    $totalPages = ceil($total / Config::ITEMS_PER_PAGE);
    $categorias = Product::getCategories();

    require __DIR__ . '/../views/layouts/header.php';
    require __DIR__ . '/../views/index.php';
    require __DIR__ . '/../views/layouts/footer.php';

} elseif ($request_uri === '/buscar') {
    // BÚSQUEDA
    $termino = Security::sanitize($_GET['q'] ?? '');
    $page = (int)($_GET['page'] ?? 1);
    $page = max(1, $page);

    $productos = !empty($termino) ? Product::search($termino, $page) : [];
    $categorias = Product::getCategories();

    require __DIR__ . '/../views/layouts/header.php';
    require __DIR__ . '/../views/search.php';
    require __DIR__ . '/../views/layouts/footer.php';

} elseif ($request_uri === '/categoria') {
    // FILTRO POR CATEGORÍA
    $categoria = Security::sanitize($_GET['c'] ?? '');
    $page = (int)($_GET['page'] ?? 1);
    $page = max(1, $page);

    $productos = !empty($categoria) ? Product::getByCategory($categoria, $page) : [];
    $categorias = Product::getCategories();

    require __DIR__ . '/../views/layouts/header.php';
    require __DIR__ . '/../views/category.php';
    require __DIR__ . '/../views/layouts/footer.php';

} elseif (preg_match('#^/producto/(\d+)$#', $request_uri, $matches)) {
    // VISTA DE PRODUCTO
    $producto = Product::findById((int)$matches[1]);

    if (!$producto) {
        http_response_code(404);
        require __DIR__ . '/../views/404.php';
    } else {
        require __DIR__ . '/../views/layouts/header.php';
        require __DIR__ . '/../views/producto.php';
        require __DIR__ . '/../views/layouts/footer.php';
    }

} elseif ($request_uri === '/carrito') {
    // VISTA DEL CARRITO
    $cart = null;
    $items = [];
    $total = 0;

    if (Session::isAuthenticated()) {
        $cart = new Cart(Session::getUserId());
        $items = $cart->getItems();
        $total = $cart->getTotal();
    }

    require __DIR__ . '/../views/layouts/header.php';
    require __DIR__ . '/../views/carrito.php';
    require __DIR__ . '/../views/layouts/footer.php';

} elseif ($request_uri === '/carrito/agregar' && $request_method === 'POST') {
    // AGREGAR AL CARRITO
    if (!Session::isAuthenticated()) {
        Session::setFlash('error', 'Debe iniciar sesión para agregar productos');
        header('Location: /login');
        exit;
    }

    $productoId = Security::validateInt($_POST['producto_id'] ?? null);
    $cantidad = Security::validateInt($_POST['cantidad'] ?? 1);

    if ($productoId && $cantidad && $cantidad > 0) {
        $cart = new Cart(Session::getUserId());
        if ($cart->addProduct($productoId, $cantidad)) {
            Session::setFlash('success', 'Producto agregado al carrito');
            Security::logAction('agregar_carrito', "Producto ID: $productoId", Session::getUserId());
        } else {
            Session::setFlash('error', 'No se pudo agregar el producto');
        }
    }

    header('Location: /carrito');
    exit;

} elseif ($request_uri === '/carrito/actualizar' && $request_method === 'POST') {
    // ACTUALIZAR CARRITO
    Security::requireAuth();

    if (!Security::validateCSRF($_POST['csrf_token'] ?? '')) {
        Session::setFlash('error', 'Token inválido');
        header('Location: /carrito');
        exit;
    }

    $cart = new Cart(Session::getUserId());
    foreach ($_POST as $key => $value) {
        if (preg_match('/^cantidad_(\d+)$/', $key, $matches)) {
            $carritoId = (int)$matches[1];
            $cantidad = Security::validateInt($value);
            if ($cantidad !== null) {
                $cart->updateQuantity($carritoId, $cantidad);
            }
        }
    }

    Session::setFlash('success', 'Carrito actualizado');
    header('Location: /carrito');
    exit;

} elseif ($request_uri === '/carrito/vaciar' && $request_method === 'POST') {
    // VACIAR CARRITO
    Security::requireAuth();

    if (!Security::validateCSRF($_POST['csrf_token'] ?? '')) {
        Session::setFlash('error', 'Token inválido');
        header('Location: /carrito');
        exit;
    }

    $cart = new Cart(Session::getUserId());
    $cart->clear();

    Session::setFlash('success', 'Carrito vaciado');
    header('Location: /carrito');
    exit;

} elseif ($request_uri === '/checkout' && $request_method === 'POST') {
    // REALIZAR COMPRA
    Security::requireAuth();

    if (!Security::validateCSRF($_POST['csrf_token'] ?? '')) {
        Session::setFlash('error', 'Token inválido');
        header('Location: /carrito');
        exit;
    }

    $cart = new Cart(Session::getUserId());
    $pedidoId = $cart->checkout();

    if ($pedidoId) {
        Security::logAction('checkout', "Pedido ID: $pedidoId", Session::getUserId());
        Session::setFlash('success', 'Pedido realizado exitosamente. ID: ' . $pedidoId);
        header('Location: /pedidos');
    } else {
        Session::setFlash('error', 'Error al procesar el pedido');
        header('Location: /carrito');
    }
    exit;

} elseif ($request_uri === '/login') {
    // PÁGINA DE LOGIN
    if ($request_method === 'POST') {
        $email = Security::sanitize($_POST['email'] ?? '');
        $contraseña = $_POST['contraseña'] ?? '';

        if (Security::validateEmail($email) && !empty($contraseña)) {
            $user = User::login($email, $contraseña);
            if ($user) {
                Session::setUser($user);
                Security::logAction('login', '', $user->getId());
                Session::setFlash('success', 'Bienvenido, ' . $user->getNombre());
                header('Location: /');
            } else {
                Security::logAction('login_fallido', "Email: $email", null);
                Session::setFlash('error', 'Email o contraseña incorrectos');
            }
        } else {
            Session::setFlash('error', 'Por favor completa todos los campos');
        }
    }

    require __DIR__ . '/../views/layouts/header.php';
    require __DIR__ . '/../views/login.php';
    require __DIR__ . '/../views/layouts/footer.php';

} elseif ($request_uri === '/registro') {
    // PÁGINA DE REGISTRO
    if ($request_method === 'POST') {
        $nombre = Security::sanitize($_POST['nombre'] ?? '');
        $email = Security::sanitize($_POST['email'] ?? '');
        $contraseña = $_POST['contraseña'] ?? '';
        $contraseña2 = $_POST['contraseña2'] ?? '';

        if (empty($nombre) || empty($email) || empty($contraseña)) {
            Session::setFlash('error', 'Por favor completa todos los campos');
        } elseif (!Security::validateEmail($email)) {
            Session::setFlash('error', 'Email inválido');
        } elseif (!Security::validatePassword($contraseña)) {
            Session::setFlash('error', 'Contraseña débil (mín 8 caracteres, 1 mayúscula, 1 número)');
        } elseif ($contraseña !== $contraseña2) {
            Session::setFlash('error', 'Las contraseñas no coinciden');
        } else {
            if (User::register($nombre, $email, $contraseña)) {
                Security::logAction('registro', "Email: $email", null);
                Session::setFlash('success', 'Registro exitoso. Ahora puedes iniciar sesión');
                header('Location: /login');
                exit;
            } else {
                Session::setFlash('error', 'Error al registrarse. El email ya está en uso');
            }
        }
    }

    require __DIR__ . '/../views/layouts/header.php';
    require __DIR__ . '/../views/registro.php';
    require __DIR__ . '/../views/layouts/footer.php';

} elseif ($request_uri === '/logout') {
    // LOGOUT
    if (Session::isAuthenticated()) {
        Security::logAction('logout', '', Session::getUserId());
    }
    Session::destroy();
    Session::setFlash('success', 'Sesión cerrada');
    header('Location: /');
    exit;

} else {
    // 404
    http_response_code(404);
    require __DIR__ . '/../views/layouts/header.php';
    require __DIR__ . '/../views/404.php';
    require __DIR__ . '/../views/layouts/footer.php';
}

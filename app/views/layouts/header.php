<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= isset($titulo) ? htmlspecialchars($titulo) : 'Tienda Online' ?></title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <!-- NAVBAR -->
    <nav class="navbar">
        <div class="navbar-container">
            <div class="navbar-brand">
                <a href="/">🛍️ TIENDA ONLINE</a>
            </div>

            <div class="navbar-menu">
                <!-- Búsqueda -->
                <form action="/buscar" method="GET" class="navbar-search">
                    <input type="text" name="q" placeholder="Buscar productos..." required>
                    <button type="submit">Buscar</button>
                </form>

                <!-- Links -->
                <div class="navbar-links">
                    <a href="/">Inicio</a>
                    
                    <!-- Categorías dropdown -->
                    <div class="dropdown">
                        <button class="dropbtn">Categorías ▼</button>
                        <div class="dropdown-content">
                            <?php 
                            if (isset($categorias) && is_array($categorias)) {
                                foreach ($categorias as $cat) {
                                    echo '<a href="/categoria?c=' . urlencode($cat) . '">' . htmlspecialchars($cat) . '</a>';
                                }
                            }
                            ?>
                        </div>
                    </div>

                    <?php if (Session::isAuthenticated()): ?>
                        <div class="user-menu">
                            <span>👤 <?= htmlspecialchars(Session::get('user_nombre')) ?></span>
                            <a href="/logout">Logout</a>
                        </div>
                    <?php else: ?>
                        <a href="/login">Login</a>
                        <a href="/registro">Registro</a>
                    <?php endif; ?>

                    <!-- Carrito -->
                    <a href="/carrito" class="carrito-btn">
                        🛒 Carrito
                        <?php if (Session::isAuthenticated()): ?>
                            <span class="carrito-count">
                                <?php 
                                $cart = new Cart(Session::getUserId());
                                echo $cart->getItemCount();
                                ?>
                            </span>
                        <?php endif; ?>
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <!-- MENSAJES FLASH -->
    <?php 
    $flashes = Session::getFlash();
    if (is_array($flashes)):
        foreach ($flashes as $tipo => $mensaje): 
    ?>
        <div class="alert alert-<?= htmlspecialchars($tipo) ?>">
            <?= htmlspecialchars($mensaje) ?>
            <button class="alert-close" onclick="this.parentElement.style.display='none';">×</button>
        </div>
    <?php 
        endforeach;
    endif;
    ?>

    <!-- CONTENIDO PRINCIPAL -->
    <main class="container">

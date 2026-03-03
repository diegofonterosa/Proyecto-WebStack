<?php $titulo = 'Carrito de Compras'; ?>

    <section class="carrito-section">
        <h1>🛒 Carrito de Compras</h1>

        <?php if (!Session::isAuthenticated()): ?>
            <div class="alert alert-info">
                <p>Debes <a href="/login">iniciar sesión</a> para comprar. ¿No tienes cuenta? <a href="/registro">Regístrate aquí</a></p>
            </div>
        <?php elseif (empty($items)): ?>
            <div class="empty-cart">
                <p>Tu carrito está vacío</p>
                <a href="/" class="btn btn-primary">Continuar comprando</a>
            </div>
        <?php else: ?>
            <div class="cart-container">
                <!-- TABLA DE ITEMS -->
                <div class="cart-items">
                    <table class="cart-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Precio</th>
                                <th>Cantidad</th>
                                <th>Subtotal</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($items as $item): 
                                $subtotal = $item['precio'] * $item['cantidad'];
                            ?>
                                <tr class="cart-item">
                                    <td>
                                        <div class="item-name">
                                            <img src="<?= htmlspecialchars($item['imagen_url']) ?>" alt="">
                                            <a href="/producto/<?= $item['producto_id'] ?>">
                                                <?= htmlspecialchars($item['nombre']) ?>
                                            </a>
                                        </div>
                                    </td>
                                    <td>$<?= number_format($item['precio'], 2) ?></td>
                                    <td>
                                        <input type="number" class="cantidad-input" value="<?= $item['cantidad'] ?>" 
                                               min="1" max="<?= $item['stock'] ?>"
                                               data-carrito-id="<?= $item['id'] ?>">
                                    </td>
                                    <td class="subtotal">$<?= number_format($subtotal, 2) ?></td>
                                    <td>
                                        <button class="btn-remove" data-id="<?= $item['id'] ?>">
                                            ✕ Quitar
                                        </button>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <!-- RESUMEN -->
                <div class="cart-summary">
                    <div class="summary-box">
                        <h2>Resumen</h2>
                        
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span>$<?= number_format($total, 2) ?></span>
                        </div>
                        <div class="summary-row">
                            <span>Impuesto (IVA 21%):</span>
                            <span>$<?= number_format($total * 0.21, 2) ?></span>
                        </div>
                        <div class="summary-row total">
                            <span>Total:</span>
                            <span>$<?= number_format($total * 1.21, 2) ?></span>
                        </div>

                        <form action="/checkout" method="POST" class="checkout-form">
                            <?= Security::getCSRFInput() ?>
                            <button type="submit" class="btn btn-success btn-large">
                                💳 Completar Compra
                            </button>
                        </form>

                        <form action="/carrito/vaciar" method="POST">
                            <?= Security::getCSRFInput() ?>
                            <button type="submit" class="btn btn-outline">
                                Vaciar Carrito
                            </button>
                        </form>

                        <a href="/" class="btn btn-outline">
                            ← Continuar Comprando
                        </a>
                    </div>

                    <div class="info-box">
                        <h3>Información de Seguridad</h3>
                        <ul>
                            <li>✓ Conexión HTTPS Segura</li>
                            <li>✓ Datos Encriptados</li>
                            <li>✓ Pago Certificado</li>
                            <li>✓ Privacidad Garantizada</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- FORM ACTUALIZAR (hidden) -->
            <form id="update-cart-form" action="/carrito/actualizar" method="POST" style="display:none;">
                <?= Security::getCSRFInput() ?>
                <div id="update-fields"></div>
            </form>
        <?php endif; ?>
    </section>


<?php $titulo = 'Detalles del Producto'; ?>

    <?php if ($producto): ?>
        <section class="producto-detalle">
            <div class="breadcrumb">
                <a href="/">Inicio</a> / <?= htmlspecialchars($producto->getNombre()) ?>
            </div>

            <div class="producto-container">
                <div class="producto-imagen">
                    <img src="<?= htmlspecialchars($producto->getImagenUrl()) ?>" 
                         alt="<?= htmlspecialchars($producto->getNombre()) ?>"
                         class="main-image">
                </div>

                <div class="producto-datos">
                    <h1><?= htmlspecialchars($producto->getNombre()) ?></h1>
                    
                    <div class="product-meta">
                        <span class="category">Categoría: <?= htmlspecialchars($producto->getCategoria()) ?></span>
                        <span class="stock <?= $producto->getStock() > 0 ? 'available' : 'unavailable' ?>">
                            Stock: <?= $producto->getStock() > 0 ? $producto->getStock() . ' unidades' : 'Agotado' ?>
                        </span>
                    </div>

                    <div class="precio">
                        <h2>$<?= number_format($producto->getPrecio(), 2) ?></h2>
                    </div>

                    <div class="descripcion">
                        <h3>Descripción</h3>
                        <p><?= nl2br(htmlspecialchars($producto->getDescripcion())) ?></p>
                    </div>

                    <?php if ($producto->hasStock()): ?>
                        <form action="/carrito/agregar" method="POST" class="form-agregar">
                            <div class="form-group">
                                <label for="cantidad">Cantidad:</label>
                                <input type="number" id="cantidad" name="cantidad" value="1" min="1" 
                                       max="<?= $producto->getStock() ?>" required>
                            </div>
                            <input type="hidden" name="producto_id" value="<?= $producto->getId() ?>">
                            <button type="submit" class="btn btn-success btn-large">
                                🛒 Agregar al Carrito
                            </button>
                        </form>
                    <?php else: ?>
                        <div class="alert alert-warning">
                            Este producto no está disponible en este momento
                        </div>
                    <?php endif; ?>

                    <div class="info-box">
                        <h3>Información de Compra</h3>
                        <ul>
                            <li>✓ Envío rápido y seguro</li>
                            <li>✓ Devolución sin preguntas en 30 días</li>
                            <li>✓ Garantía de calidad</li>
                            <li>✓ Pago seguro con encriptación HTTPS</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- PRODUCTOS RELACIONADOS -->
        <section class="related-products">
            <h2>Productos Similares</h2>
            <div class="products-grid">
                <?php 
                $relacionados = Product::getByCategory($producto->getCategoria());
                foreach (array_slice($relacionados, 0, 4) as $prod):
                    if ($prod['id'] != $producto->getId()):
                ?>
                    <div class="product-card">
                        <div class="product-image">
                            <img src="<?= htmlspecialchars($prod['imagen_url']) ?>" 
                                 alt="<?= htmlspecialchars($prod['nombre']) ?>">
                        </div>
                        <div class="product-info">
                            <h3><?= htmlspecialchars($prod['nombre']) ?></h3>
                            <span class="price">$<?= number_format($prod['precio'], 2) ?></span>
                            <a href="/producto/<?= $prod['id'] ?>" class="btn btn-primary btn-small">Ver</a>
                        </div>
                    </div>
                <?php endif; endforeach; ?>
            </div>
        </section>
    <?php else: ?>
        <div class="alert alert-error">
            Producto no encontrado
        </div>
    <?php endif; ?>


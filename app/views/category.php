<?php $titulo = isset($categoria) ? htmlspecialchars($categoria) : 'Categoría'; ?>

    <section class="category-section">
        <div class="category-header">
            <h1>Categoría: <?= htmlspecialchars($categoria) ?></h1>
        </div>

        <?php if (empty($productos)): ?>
            <div class="empty-state">
                <p>No hay productos en esta categoría</p>
                <a href="/" class="btn btn-primary">Volver al Catálogo</a>
            </div>
        <?php else: ?>
            <div class="products-grid">
                <?php foreach ($productos as $prod): ?>
                    <div class="product-card">
                        <div class="product-image">
                            <img src="<?= htmlspecialchars($prod['imagen_url']) ?>" 
                                 alt="<?= htmlspecialchars($prod['nombre']) ?>">
                            <?php if ($prod['stock'] <= 0): ?>
                                <div class="out-of-stock">Agotado</div>
                            <?php endif; ?>
                        </div>
                        <div class="product-info">
                            <h3><?= htmlspecialchars($prod['nombre']) ?></h3>
                            <p class="product-description">
                                <?= htmlspecialchars(substr($prod['descripcion'], 0, 80)) ?>...
                            </p>
                            <div class="product-footer">
                                <span class="price">$<?= number_format($prod['precio'], 2) ?></span>
                                <a href="/producto/<?= $prod['id'] ?>" class="btn btn-primary">Ver Detalles</a>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </section>


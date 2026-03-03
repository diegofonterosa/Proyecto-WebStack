<?php $titulo = 'Búsqueda'; ?>

    <section class="search-section">
        <div class="search-header">
            <h1>Resultados de Búsqueda</h1>
            <?php if (!empty($termino)): ?>
                <p>Buscando: <strong><?= htmlspecialchars($termino) ?></strong></p>
            <?php endif; ?>
        </div>

        <?php if (empty($productos)): ?>
            <div class="empty-state">
                <p>No se encontraron productos con los criterios especificados</p>
                <a href="/" class="btn btn-primary">Volver al Catálogo</a>
            </div>
        <?php else: ?>
            <div class="products-grid">
                <?php foreach ($productos as $prod): ?>
                    <div class="product-card">
                        <div class="product-image">
                            <img src="<?= htmlspecialchars($prod['imagen_url']) ?>" 
                                 alt="<?= htmlspecialchars($prod['nombre']) ?>">
                        </div>
                        <div class="product-info">
                            <h3><?= htmlspecialchars($prod['nombre']) ?></h3>
                            <p class="product-category"><?= htmlspecialchars($prod['categoria'] ?? 'Sin categoría') ?></p>
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


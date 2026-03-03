<?php $titulo = 'Catálogo de Productos'; ?>

    <section class="hero">
        <h1>Bienvenido a Nuestra Tienda</h1>
        <p>Encuentra los mejores productos deportivos y de moda</p>
    </section>

    <!-- FILTROS -->
    <section class="filters">
        <div class="filter-group">
            <label for="categoria-filter">Filtrar por Categoría:</label>
            <select id="categoria-filter" onchange="window.location = '/categoria?c=' + this.value">
                <option value="">Todas</option>
                <?php foreach ($categorias as $cat): ?>
                    <option value="<?= urlencode($cat) ?>"><?= htmlspecialchars($cat) ?></option>
                <?php endforeach; ?>
            </select>
        </div>
    </section>

    <!-- PRODUCTOS -->
    <section class="products">
        <h2>Catálogo</h2>
        
        <?php if (empty($productos)): ?>
            <div class="empty-state">
                <p>No hay productos disponibles en este momento</p>
            </div>
        <?php else: ?>
            <div class="products-grid">
                <?php foreach ($productos as $prod): ?>
                    <div class="product-card">
                        <div class="product-image">
                            <img src="<?= htmlspecialchars($prod['imagen_url'] ?? '/images/placeholder.jpg') ?>" 
                                 alt="<?= htmlspecialchars($prod['nombre']) ?>">
                            <?php if ($prod['stock'] <= 0): ?>
                                <div class="out-of-stock">Agotado</div>
                            <?php endif; ?>
                        </div>

                        <div class="product-info">
                            <h3><?= htmlspecialchars($prod['nombre']) ?></h3>
                            <p class="product-category"><?= htmlspecialchars($prod['categoria'] ?? 'Sin categoría') ?></p>
                            <p class="product-description">
                                <?= htmlspecialchars(substr($prod['descripcion'], 0, 80)) ?>...
                            </p>

                            <div class="product-footer">
                                <span class="price">$<?= number_format($prod['precio'], 2) ?></span>
                                <a href="/producto/<?= $prod['id'] ?>" class="btn btn-primary">Ver Détalle</a>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>

            <!-- PAGINACIÓN -->
            <?php if ($totalPages > 1): ?>
                <div class="pagination">
                    <?php if ($page > 1): ?>
                        <a href="/?page=<?= $page - 1 ?>" class="btn">← Anterior</a>
                    <?php endif; ?>

                    <span class="page-info">Página <?= $page ?> de <?= $totalPages ?></span>

                    <?php if ($page < $totalPages): ?>
                        <a href="/?page=<?= $page + 1 ?>" class="btn">Siguiente →</a>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        <?php endif; ?>
    </section>


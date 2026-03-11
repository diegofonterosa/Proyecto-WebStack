/**
 * Tests de integración — Product Service
 * Requiere el stack corriendo: docker compose up -d
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'http://localhost:5000';

async function get(path) {
    const res = await fetch(`${BASE}${path}`);
    return { status: res.status, body: await res.json() };
}

// ──────────────────────────────────────────────
//  Listado de productos
// ──────────────────────────────────────────────
describe('Productos — Listado', () => {
    it('GET /api/productos devuelve 200 y array de datos', async () => {
        const { status, body } = await get('/api/productos');
        assert.equal(status, 200, JSON.stringify(body));
        assert.ok(Array.isArray(body.datos), 'body.datos debe ser array');
        assert.ok(body.datos.length > 0, 'Debe haber al menos un producto en seed');
    });

    it('cada producto tiene los campos requeridos', async () => {
        const { body } = await get('/api/productos');
        const required = ['id', 'nombre', 'precio', 'stock', 'categoria'];
        for (const p of body.datos) {
            for (const field of required) {
                assert.ok(field in p, `producto debe tener campo '${field}'`);
            }
        }
    });

    it('soporta paginación: page=1&limit=2 devuelve máx 2 productos', async () => {
        const { status, body } = await get('/api/productos?page=1&limit=2');
        assert.equal(status, 200);
        assert.ok(body.datos.length <= 2, `Esperado ≤2 productos, recibido ${body.datos.length}`);
        assert.ok(body.pagination, 'Debe incluir objeto pagination');
    });

    it('page fuera de rango devuelve 200 con array vacío o válido', async () => {
        const { status, body } = await get('/api/productos?page=99999');
        assert.equal(status, 200);
        assert.ok(Array.isArray(body.datos));
    });
});

// ──────────────────────────────────────────────
//  Detalle de producto
// ──────────────────────────────────────────────
describe('Productos — Detalle', () => {
    it('GET /api/productos/1 devuelve 200 y objeto datos', async () => {
        const { status, body } = await get('/api/productos/1');
        assert.equal(status, 200, JSON.stringify(body));
        assert.ok(body.datos, 'Debe haber body.datos');
        assert.equal(body.datos.id, 1);
    });

    it('producto inexistente devuelve 404', async () => {
        const { status } = await get('/api/productos/99999');
        assert.equal(status, 404);
    });

    it('ID no numérico devuelve 400 o 404', async () => {
        const { status } = await get('/api/productos/abc');
        assert.ok([400, 404].includes(status), `Esperado 400 o 404, recibido ${status}`);
    });
});

// ──────────────────────────────────────────────
//  Búsqueda
// ──────────────────────────────────────────────
describe('Productos — Búsqueda', () => {
    it('GET /api/productos/search?q=... devuelve 200 y array', async () => {
        const { status, body } = await get('/api/productos/search?q=a');
        assert.equal(status, 200);
        assert.ok(Array.isArray(body.datos));
    });

    it('búsqueda sin coincidencias devuelve 200 con array vacío', async () => {
        const { status, body } = await get('/api/productos/search?q=zzzznonexist9999');
        assert.equal(status, 200);
        assert.ok(Array.isArray(body.datos));
        assert.equal(body.datos.length, 0);
    });

    it('búsqueda por categoría devuelve productos de esa categoría', async () => {
        // Primero obtenemos una categoría real del seed
        const { body: prod } = await get('/api/productos/1');
        const cat = prod.datos?.categoria;
        if (!cat) return; // skip si no hay categoría

        const { status, body } = await get(`/api/productos/search?categoria=${encodeURIComponent(cat)}`);
        assert.equal(status, 200);
        for (const p of body.datos) {
            assert.equal(p.categoria, cat, `Producto ${p.id} debería ser de categoría ${cat}`);
        }
    });
});

// ──────────────────────────────────────────────
//  Categorías
// ──────────────────────────────────────────────
describe('Productos — Categorías', () => {
    it('GET /api/categorias devuelve 200 y array no vacío', async () => {
        const { status, body } = await get('/api/categorias');
        assert.equal(status, 200, JSON.stringify(body));
        assert.ok(Array.isArray(body.datos), 'body.datos debe ser array');
        assert.ok(body.datos.length > 0, 'Debe haber al menos una categoría');
    });

    it('cada categoría tiene el campo categoria', async () => {
        const { body } = await get('/api/categorias');
        for (const cat of body.datos) {
            assert.ok(cat.categoria, `Falta campo categoria en ${JSON.stringify(cat)}`);
        }
    });
});

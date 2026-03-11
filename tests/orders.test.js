/**
 * Tests de integración — Order Service (Carrito + Pedidos)
 * Requiere el stack corriendo: docker compose up -d
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const UNIQUE = Date.now();
const TEST_EMAIL = `test.order.${UNIQUE}@tienda.local`;

let token = null;
let cartItemId = null;

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────
async function api(method, path, body, tok) {
    const headers = { 'Content-Type': 'application/json' };
    if (tok) headers.Authorization = `Bearer ${tok}`;
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json() };
}

// ──────────────────────────────────────────────
//  Setup: crear usuario de prueba
// ──────────────────────────────────────────────
before(async () => {
    const { body } = await api('POST', '/api/auth/register', {
        nombre: 'Order Test User',
        email: TEST_EMAIL,
        contrasena: 'OrderTest123!',
    });
    token = body.token;
    assert.ok(token, `No se pudo registrar el usuario de prueba: ${JSON.stringify(body)}`);
});

// ──────────────────────────────────────────────
//  Carrito — estado inicial
// ──────────────────────────────────────────────
describe('Carrito — estado inicial', () => {
    it('GET /api/carrito sin token devuelve 401', async () => {
        const { status } = await api('GET', '/api/carrito');
        assert.equal(status, 401);
    });

    it('GET /api/carrito con token devuelve 200 y carrito vacío', async () => {
        const { status, body } = await api('GET', '/api/carrito', null, token);
        assert.equal(status, 200, JSON.stringify(body));
        assert.ok(Array.isArray(body.items), 'body.items debe ser array');
        assert.equal(body.items.length, 0);
    });
});

// ──────────────────────────────────────────────
//  Carrito — agregar
// ──────────────────────────────────────────────
describe('Carrito — agregar producto', () => {
    it('POST /api/carrito/agregar añade un producto y devuelve 200', async () => {
        const { status, body } = await api('POST', '/api/carrito/agregar', {
            producto_id: 1,
            cantidad: 2,
        }, token);
        assert.equal(status, 200, JSON.stringify(body));
        assert.ok(body.success);
    });

    it('el carrito ahora contiene el producto añadido', async () => {
        const { body } = await api('GET', '/api/carrito', null, token);
        assert.equal(body.items.length, 1);
        assert.equal(body.items[0].producto_id, 1);
        assert.equal(Number(body.items[0].cantidad), 2);
        cartItemId = body.items[0].id;
    });

    it('rechaza cantidad 0 con 400', async () => {
        const { status } = await api('POST', '/api/carrito/agregar', {
            producto_id: 1,
            cantidad: 0,
        }, token);
        assert.equal(status, 400);
    });

    it('rechaza producto inexistente con 400', async () => {
        const { status } = await api('POST', '/api/carrito/agregar', {
            producto_id: 99999,
            cantidad: 1,
        }, token);
        assert.equal(status, 400);
    });

    it('rechaza sin token con 401', async () => {
        const { status } = await api('POST', '/api/carrito/agregar', {
            producto_id: 1,
            cantidad: 1,
        });
        assert.equal(status, 401);
    });
});

// ──────────────────────────────────────────────
//  Carrito — actualizar cantidad
// ──────────────────────────────────────────────
describe('Carrito — actualizar cantidad', () => {
    it('PUT /api/carrito/:id actualiza a cantidad 3 y devuelve 200', async () => {
        const { status, body } = await api('PUT', `/api/carrito/${cartItemId}`, { cantidad: 3 }, token);
        assert.equal(status, 200, JSON.stringify(body));
        assert.ok(body.success);
    });

    it('el ítem refleja la nueva cantidad', async () => {
        const { body } = await api('GET', '/api/carrito', null, token);
        const item = body.items.find(i => i.id === cartItemId);
        assert.ok(item, 'Ítem no encontrado en carrito');
        assert.equal(Number(item.cantidad), 3);
    });

    it('rechaza cantidad 0 con 400', async () => {
        const { status } = await api('PUT', `/api/carrito/${cartItemId}`, { cantidad: 0 }, token);
        assert.equal(status, 400);
    });

    it('rechaza ítem de otro usuario con 404', async () => {
        const { status } = await api('PUT', '/api/carrito/99999', { cantidad: 1 }, token);
        assert.equal(status, 404);
    });

    it('rechaza sin token con 401', async () => {
        const { status } = await api('PUT', `/api/carrito/${cartItemId}`, { cantidad: 1 });
        assert.equal(status, 401);
    });
});

// ──────────────────────────────────────────────
//  Pedidos — checkout
// ──────────────────────────────────────────────
describe('Pedidos — crear', () => {
    it('POST /api/pedidos/crear con carrito lleno devuelve 201 y pedido_id', async () => {
        const { status, body } = await api('POST', '/api/pedidos/crear', {}, token);
        assert.equal(status, 201, JSON.stringify(body));
        assert.ok(body.success);
        assert.ok(body.pedido_id, 'Debe incluir pedido_id');
        assert.ok(Number(body.total) > 0, 'Total debe ser mayor que 0');
    });

    it('el carrito queda vacío después del checkout', async () => {
        const { body } = await api('GET', '/api/carrito', null, token);
        assert.equal(body.items.length, 0, 'Carrito debe estar vacío tras el checkout');
    });

    it('POST /api/pedidos/crear con carrito vacío devuelve 400', async () => {
        const { status } = await api('POST', '/api/pedidos/crear', {}, token);
        assert.equal(status, 400);
    });

    it('rechaza sin token con 401', async () => {
        const { status } = await api('POST', '/api/pedidos/crear', {});
        assert.equal(status, 401);
    });
});

// ──────────────────────────────────────────────
//  Pedidos — historial
// ──────────────────────────────────────────────
describe('Pedidos — historial', () => {
    it('GET /api/pedidos devuelve 200 y el pedido creado', async () => {
        const { status, body } = await api('GET', '/api/pedidos', null, token);
        assert.equal(status, 200, JSON.stringify(body));
        assert.ok(Array.isArray(body.datos), 'body.datos debe ser array');
        assert.ok(body.datos.length > 0, 'Debe haber al menos el pedido creado');
    });

    it('cada pedido tiene campos requeridos', async () => {
        const { body } = await api('GET', '/api/pedidos', null, token);
        for (const p of body.datos) {
            assert.ok('id' in p);
            assert.ok('total' in p);
            assert.ok('estado' in p);
            assert.ok('fecha_pedido' in p);
        }
    });

    it('rechaza sin token con 401', async () => {
        const { status } = await api('GET', '/api/pedidos');
        assert.equal(status, 401);
    });
});

// ──────────────────────────────────────────────
//  Carrito — eliminar ítem
// ──────────────────────────────────────────────
describe('Carrito — eliminar ítem', () => {
    it('añade un ítem nuevo para poder eliminarlo', async () => {
        const { status } = await api('POST', '/api/carrito/agregar', {
            producto_id: 1,
            cantidad: 1,
        }, token);
        assert.equal(status, 200);
    });

    it('DELETE /api/carrito/:id elimina el ítem y devuelve 200', async () => {
        const { body: cart } = await api('GET', '/api/carrito', null, token);
        const id = cart.items[0]?.id;
        assert.ok(id, 'Debe haber un ítem para eliminar');

        const { status, body } = await api('DELETE', `/api/carrito/${id}`, null, token);
        assert.equal(status, 200, JSON.stringify(body));
        assert.ok(body.success);
    });

    it('DELETE sobre ítem inexistente devuelve 404', async () => {
        const { status } = await api('DELETE', '/api/carrito/99999', null, token);
        assert.equal(status, 404);
    });

    it('rechaza sin token con 401', async () => {
        const { status } = await api('DELETE', '/api/carrito/1');
        assert.equal(status, 401);
    });
});

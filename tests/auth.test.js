/**
 * Tests de integración — Auth Service
 * Requiere el stack corriendo: docker compose up -d
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const UNIQUE = Date.now();
const TEST_EMAIL = `test.auth.${UNIQUE}@tienda.local`;
const TEST_NAME = 'Test Auth User';
const TEST_PASS = 'TestPass123!';

let registeredToken = null;

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────
async function post(path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
}

async function get(path, token) {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, { headers });
    return { status: res.status, body: await res.json() };
}

// ──────────────────────────────────────────────
//  Registro
// ──────────────────────────────────────────────
describe('Auth — Registro', () => {
    it('registra un nuevo usuario y devuelve 201 + token', async () => {
        const { status, body } = await post('/api/auth/register', {
            nombre: TEST_NAME,
            email: TEST_EMAIL,
            contrasena: TEST_PASS,
        });
        assert.equal(status, 201, `Esperado 201, recibido ${status}: ${JSON.stringify(body)}`);
        assert.ok(body.token, 'Debe haber token en la respuesta');
        assert.equal(typeof body.token, 'string');
        registeredToken = body.token;
    });

    it('rechaza email duplicado con 409', async () => {
        const { status, body } = await post('/api/auth/register', {
            nombre: TEST_NAME,
            email: TEST_EMAIL,
            contrasena: TEST_PASS,
        });
        assert.equal(status, 409, `Esperado 409, recibido ${status}: ${JSON.stringify(body)}`);
    });

    it('rechaza registro sin email con 400', async () => {
        const { status } = await post('/api/auth/register', {
            nombre: 'Sin Email',
            contrasena: 'Pass123!',
        });
        assert.equal(status, 400);
    });

    it('rechaza registro sin contraseña con 400', async () => {
        const { status } = await post('/api/auth/register', {
            nombre: 'Sin Pass',
            email: `nopass.${UNIQUE}@tienda.local`,
        });
        assert.equal(status, 400);
    });
});

// ──────────────────────────────────────────────
//  Login
// ──────────────────────────────────────────────
describe('Auth — Login', () => {
    it('hace login con credenciales correctas y devuelve 200 + token', async () => {
        const { status, body } = await post('/api/auth/login', {
            email: TEST_EMAIL,
            contrasena: TEST_PASS,
        });
        assert.equal(status, 200, JSON.stringify(body));
        assert.ok(body.token, 'Debe haber token');
        assert.ok(body.usuario?.email, 'Debe haber datos del usuario');
        assert.equal(body.usuario.email, TEST_EMAIL);
    });

    it('rechaza contraseña incorrecta con 401', async () => {
        const { status } = await post('/api/auth/login', {
            email: TEST_EMAIL,
            contrasena: 'wrongpassword',
        });
        assert.equal(status, 401);
    });

    it('rechaza email inexistente con 401', async () => {
        const { status } = await post('/api/auth/login', {
            email: 'notexist@tienda.local',
            contrasena: 'anyPass123',
        });
        assert.equal(status, 401);
    });

    it('rechaza payload vacío con 400', async () => {
        const { status } = await post('/api/auth/login', {});
        assert.equal(status, 400);
    });
});

// ──────────────────────────────────────────────
//  Verificar token (acceso a recurso protegido)
// ──────────────────────────────────────────────
describe('Auth — Token JWT', () => {
    it('token inválido es rechazado al acceder al carrito', async () => {
        const { status } = await get('/api/carrito', 'token.invalido.aqui');
        assert.equal(status, 401);
    });

    it('sin token es rechazado al crear pedido', async () => {
        const res = await fetch(`${BASE}/api/pedidos/crear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
        });
        assert.equal(res.status, 401);
    });
});

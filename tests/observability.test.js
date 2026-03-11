/**
 * Tests de integración — Observabilidad del Gateway
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL || 'http://localhost:5000';

describe('Observabilidad — Health y Metrics', () => {
    it('GET /health responde 200 e incluye timestamp', async () => {
        const res = await fetch(`${BASE}/health`);
        const body = await res.json();
        assert.equal(res.status, 200, JSON.stringify(body));
        assert.ok(body.timestamp);
    });

    it('GET /health/deep responde 200 o 503 e incluye checks', async () => {
        const res = await fetch(`${BASE}/health/deep`);
        const body = await res.json();
        assert.ok([200, 503].includes(res.status), `Status inesperado: ${res.status}`);
        assert.ok(Array.isArray(body.checks), 'checks debe ser array');
        assert.ok(body.checks.length >= 3, 'debe incluir checks de dependencias');
    });

    it('GET /metrics responde JSON con contadores', async () => {
        const res = await fetch(`${BASE}/metrics`);
        const body = await res.json();
        assert.equal(res.status, 200);
        assert.ok('requests_total' in body);
        assert.ok('errors_total' in body);
        assert.ok(body.latency_ms && typeof body.latency_ms === 'object');
    });

    it('GET /metrics?format=prometheus responde texto con series', async () => {
        const res = await fetch(`${BASE}/metrics?format=prometheus`, {
            headers: { Accept: 'text/plain' }
        });
        const text = await res.text();
        assert.equal(res.status, 200);
        assert.match(text, /gateway_requests_total\s+\d+/);
        assert.match(text, /gateway_latency_ms_p95\s+[0-9.]+/);
    });

    it('propaga x-request-id en la respuesta', async () => {
        const expected = `obs-test-${Date.now()}`;
        const res = await fetch(`${BASE}/health`, {
            headers: { 'x-request-id': expected }
        });
        assert.equal(res.status, 200);
        assert.equal(res.headers.get('x-request-id'), expected);
    });
});

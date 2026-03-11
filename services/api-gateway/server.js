const express = require('express');
const cors = require('cors');
const httpProxy = require('express-http-proxy');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();

const viewsDir = process.env.EJS_VIEWS_DIR || path.resolve(__dirname, '../../app/views');
const publicAssetsDir = process.env.PUBLIC_ASSETS_DIR || path.resolve(__dirname, '../../app/public');

const MAX_LATENCY_SAMPLES = 400;
const dependencyTimeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS || 2000);
const appMetrics = {
    startedAt: Date.now(),
    requestsTotal: 0,
    errorsTotal: 0,
    byMethod: {},
    byStatus: {},
    byRoute: {},
    latencySamplesMs: []
};

const normalizeRoute = (rawPath) => {
    if (!rawPath) return '/';
    return rawPath
        .replace(/\/(\d+)(?=\/|$)/g, '/:id')
        .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}(?=\/|$)/gi, '/:id');
};

const pushLatencySample = (durationMs) => {
    appMetrics.latencySamplesMs.push(durationMs);
    if (appMetrics.latencySamplesMs.length > MAX_LATENCY_SAMPLES) {
        appMetrics.latencySamplesMs.shift();
    }
};

const percentile = (values, p) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * (sorted.length - 1)));
    return sorted[idx];
};

const buildMetricsSnapshot = () => {
    const samples = appMetrics.latencySamplesMs;
    const totalLatency = samples.reduce((acc, item) => acc + item, 0);
    const avg = samples.length ? totalLatency / samples.length : 0;
    const p95 = percentile(samples, 95);
    const max = samples.length ? Math.max(...samples) : 0;

    return {
        service: 'api-gateway',
        environment: process.env.NODE_ENV || 'development',
        started_at: new Date(appMetrics.startedAt).toISOString(),
        uptime_seconds: Number(process.uptime().toFixed(2)),
        requests_total: appMetrics.requestsTotal,
        errors_total: appMetrics.errorsTotal,
        error_rate: appMetrics.requestsTotal
            ? Number((appMetrics.errorsTotal / appMetrics.requestsTotal).toFixed(4))
            : 0,
        latency_ms: {
            avg: Number(avg.toFixed(2)),
            p95: Number(p95.toFixed(2)),
            max: Number(max.toFixed(2)),
            samples: samples.length
        },
        by_method: appMetrics.byMethod,
        by_status: appMetrics.byStatus,
        by_route: appMetrics.byRoute,
        memory: process.memoryUsage()
    };
};

const buildPrometheusMetrics = (snapshot) => {
    const lines = [
        '# HELP gateway_uptime_seconds API Gateway uptime in seconds',
        '# TYPE gateway_uptime_seconds gauge',
        `gateway_uptime_seconds ${snapshot.uptime_seconds}`,
        '# HELP gateway_requests_total Total HTTP requests',
        '# TYPE gateway_requests_total counter',
        `gateway_requests_total ${snapshot.requests_total}`,
        '# HELP gateway_errors_total Total HTTP errors (status >= 500)',
        '# TYPE gateway_errors_total counter',
        `gateway_errors_total ${snapshot.errors_total}`,
        '# HELP gateway_latency_ms_avg Average latency in milliseconds',
        '# TYPE gateway_latency_ms_avg gauge',
        `gateway_latency_ms_avg ${snapshot.latency_ms.avg}`,
        '# HELP gateway_latency_ms_p95 P95 latency in milliseconds',
        '# TYPE gateway_latency_ms_p95 gauge',
        `gateway_latency_ms_p95 ${snapshot.latency_ms.p95}`
    ];

    Object.entries(snapshot.by_status).forEach(([status, count]) => {
        lines.push(`gateway_requests_by_status{status="${status}"} ${count}`);
    });

    Object.entries(snapshot.by_method).forEach(([method, count]) => {
        lines.push(`gateway_requests_by_method{method="${method}"} ${count}`);
    });

    return lines.join('\n') + '\n';
};

const withRequestIdProxy = (options = {}) => {
    const originalDecorator = options.proxyReqOptDecorator;
    return {
        ...options,
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            const opts = proxyReqOpts;
            opts.headers = opts.headers || {};
            if (srcReq.requestId) {
                opts.headers['x-request-id'] = srcReq.requestId;
            }

            if (typeof originalDecorator === 'function') {
                return originalDecorator(opts, srcReq);
            }

            return opts;
        }
    };
};

const checkDependency = async (name, url, required = true) => {
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(dependencyTimeoutMs) });
        return {
            name,
            required,
            status: response.ok ? 'up' : 'down',
            http_status: response.status
        };
    } catch (error) {
        return {
            name,
            required,
            status: 'down',
            error: error.message
        };
    }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(publicAssetsDir));
app.set('view engine', 'ejs');
app.set('views', viewsDir);

// Request tracing + structured logs + metricas HTTP
app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    const start = process.hrtime.bigint();

    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        const routeKey = `${req.method} ${normalizeRoute(req.path)}`;
        const statusCode = String(res.statusCode);

        appMetrics.requestsTotal += 1;
        appMetrics.byMethod[req.method] = (appMetrics.byMethod[req.method] || 0) + 1;
        appMetrics.byStatus[statusCode] = (appMetrics.byStatus[statusCode] || 0) + 1;
        appMetrics.byRoute[routeKey] = (appMetrics.byRoute[routeKey] || 0) + 1;
        pushLatencySample(durationMs);

        if (res.statusCode >= 500) {
            appMetrics.errorsTotal += 1;
        }

        console.log(JSON.stringify({
            ts: new Date().toISOString(),
            level: res.statusCode >= 500 ? 'error' : 'info',
            request_id: requestId,
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            duration_ms: Number(durationMs.toFixed(2)),
            user_id: req.usuario?.sub || null
        }));
    });

    next();
});

// Verificar JWT token
const verifyToken = (req, res, next) => {
    const isPublicPath =
        req.path === '/' ||
        req.path === '/login' ||
        req.path === '/register' ||
        req.path === '/carrito' ||
        req.path === '/search' ||
        req.path === '/categoria' ||
        /^\/producto\/\d+$/.test(req.path) ||
        req.path === '/health' ||
        req.path === '/health/deep' ||
        req.path === '/metrics' ||
        req.path.startsWith('/api/auth') ||
        req.path.startsWith('/api/productos') ||
        req.path.startsWith('/api/categorias') ||
        req.path.startsWith('/api/carrito') ||
        req.path.startsWith('/api/pedidos') ||
        req.path.startsWith('/api/cms');

    if (isPublicPath) {
        return next();
    }

    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            req.usuario = decoded;
        } catch (error) {
            return res.status(401).json({ error: 'Token inválido' });
        }
    }

    next();
};

app.use(verifyToken);

const parseJsonResponse = (text) => {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
};

const fetchServiceJson = async (url) => {
    const response = await fetch(url);
    const bodyText = await response.text();
    const json = parseJsonResponse(bodyText);

    if (!response.ok || !json) {
        throw new Error(`Error al consultar ${url} (${response.status})`);
    }

    return json;
};

// Vistas SSR (EJS)
app.get('/', async (req, res, next) => {
    try {
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const limit = 12;

        const [productosResp, categoriasResp] = await Promise.all([
            fetchServiceJson(`${productServiceUrl}/api/productos?page=${page}&limit=${limit}`),
            fetchServiceJson(`${productServiceUrl}/api/categorias`)
        ]);

        const productos = Array.isArray(productosResp.datos) ? productosResp.datos : [];
        const pagination = productosResp.pagination || {};
        const totalPages = Number(pagination.pages) || 1;
        const categorias = Array.isArray(categoriasResp.datos)
            ? categoriasResp.datos.map((item) => item.categoria).filter(Boolean)
            : [];

        res.render('index', {
            titulo: 'Catalogo de Productos',
            productos,
            categorias,
            page,
            totalPages
        });
    } catch (error) {
        next(error);
    }
});

app.get('/register', async (req, res) => {
    let categorias = [];

    try {
        const categoriasResp = await fetchServiceJson(`${productServiceUrl}/api/categorias`);
        categorias = Array.isArray(categoriasResp.datos)
            ? categoriasResp.datos.map((item) => item.categoria).filter(Boolean)
            : [];
    } catch {
        categorias = [];
    }

    res.render('register', {
        titulo: 'Registro',
        categorias
    });
});

app.get('/login', async (req, res) => {
    let categorias = [];

    try {
        const categoriasResp = await fetchServiceJson(`${productServiceUrl}/api/categorias`);
        categorias = Array.isArray(categoriasResp.datos)
            ? categoriasResp.datos.map((item) => item.categoria).filter(Boolean)
            : [];
    } catch {
        categorias = [];
    }

    res.render('login', {
        titulo: 'Iniciar Sesion',
        categorias
    });
});

app.get('/search', async (req, res, next) => {
    try {
        const q = String(req.query.q || '').trim();

        const [resultadosResp, categoriasResp] = await Promise.all([
            fetchServiceJson(`${productServiceUrl}/api/productos/search?q=${encodeURIComponent(q)}`),
            fetchServiceJson(`${productServiceUrl}/api/categorias`)
        ]);

        const productos = Array.isArray(resultadosResp.datos) ? resultadosResp.datos : [];
        const categorias = Array.isArray(categoriasResp.datos)
            ? categoriasResp.datos.map((item) => item.categoria).filter(Boolean)
            : [];

        res.render('index', {
            titulo: q ? `Resultados para "${q}"` : 'Busqueda de Productos',
            productos,
            categorias,
            page: 1,
            totalPages: 1
        });
    } catch (error) {
        next(error);
    }
});

app.get('/categoria', async (req, res, next) => {
    try {
        const categoria = String(req.query.c || '').trim();

        const [resultadosResp, categoriasResp] = await Promise.all([
            fetchServiceJson(`${productServiceUrl}/api/productos/search?categoria=${encodeURIComponent(categoria)}`),
            fetchServiceJson(`${productServiceUrl}/api/categorias`)
        ]);

        const productos = Array.isArray(resultadosResp.datos) ? resultadosResp.datos : [];
        const categorias = Array.isArray(categoriasResp.datos)
            ? categoriasResp.datos.map((item) => item.categoria).filter(Boolean)
            : [];

        res.render('index', {
            titulo: categoria ? `Categoria: ${categoria}` : 'Catalogo de Productos',
            productos,
            categorias,
            page: 1,
            totalPages: 1
        });
    } catch (error) {
        next(error);
    }
});

app.get('/carrito', async (req, res) => {
    let categorias = [];

    try {
        const categoriasResp = await fetchServiceJson(`${productServiceUrl}/api/categorias`);
        categorias = Array.isArray(categoriasResp.datos)
            ? categoriasResp.datos.map((item) => item.categoria).filter(Boolean)
            : [];
    } catch {
        categorias = [];
    }

    res.render('carrito', {
        titulo: 'Carrito',
        categorias
    });
});

app.get('/producto/:id', async (req, res, next) => {
    try {
        const id = Number.parseInt(req.params.id, 10);
        if (!Number.isFinite(id) || id <= 0) {
            return res.status(404).render('product', { producto: null, relacionados: [], categorias: [] });
        }

        const [detalleResp, categoriasResp] = await Promise.all([
            fetchServiceJson(`${productServiceUrl}/api/productos/${id}`),
            fetchServiceJson(`${productServiceUrl}/api/categorias`)
        ]);
        const producto = detalleResp.datos || null;
        const categorias = Array.isArray(categoriasResp.datos)
            ? categoriasResp.datos.map((item) => item.categoria).filter(Boolean)
            : [];

        if (!producto) {
            return res.status(404).render('product', { producto: null, relacionados: [], categorias });
        }

        let relacionados = [];
        if (producto.categoria) {
            const searchUrl = `${productServiceUrl}/api/productos/search?categoria=${encodeURIComponent(producto.categoria)}`;
            const relacionadosResp = await fetchServiceJson(searchUrl);
            relacionados = Array.isArray(relacionadosResp.datos) ? relacionadosResp.datos : [];
        }

        return res.render('product', {
            titulo: 'Detalle de Producto',
            producto,
            relacionados,
            categorias
        });
    } catch (error) {
        if (error.message.includes('(404)')) {
            return res.status(404).render('product', { producto: null, relacionados: [], categorias: [] });
        }
        return next(error);
    }
});

// ============== RUTAS DE MICROSERVICIOS ==============

// AUTH SERVICE (Puerto 5001)
const authServiceUrl = `http://${process.env.AUTH_SERVICE_HOST || 'auth-service'}:${process.env.AUTH_SERVICE_PORT || 5001}`;
app.use('/api/auth', httpProxy(authServiceUrl, withRequestIdProxy({
    proxyReqPathResolver: (req) => {
        const suffix = req.url === '/' ? '' : req.url;
        return '/api' + suffix;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        return proxyResData;
    }
})));

// PRODUCT SERVICE (Puerto 5002)
const productServiceUrl = `http://${process.env.PRODUCT_SERVICE_HOST || 'product-service'}:${process.env.PRODUCT_SERVICE_PORT || 5002}`;
app.use('/api/productos', httpProxy(productServiceUrl, withRequestIdProxy({
    proxyReqPathResolver: (req) => {
        const suffix = req.url === '/' ? '' : req.url;
        return '/api/productos' + suffix;
    }
})));

app.use('/api/categorias', httpProxy(productServiceUrl, withRequestIdProxy({
    proxyReqPathResolver: (req) => {
        const suffix = req.url === '/' ? '' : req.url;
        return '/api/categorias' + suffix;
    }
})));

// STRAPI CMS (puede ser interno o URL pública)
const strapiUrl = process.env.STRAPI_URL || `http://${process.env.STRAPI_HOST || 'strapi-cms'}:${process.env.STRAPI_PORT || 1337}`;
app.use('/api/cms', httpProxy(strapiUrl, withRequestIdProxy({
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        // reescribe path para que Strapi reciba /api en vez de /api/cms
        proxyReqOpts.path = srcReq.url.replace(/^\/api\/cms/, '/api');
        return proxyReqOpts;
    }
})));


// ORDER SERVICE (Puerto 5003)
const orderServiceUrl = `http://${process.env.ORDER_SERVICE_HOST || 'order-service'}:${process.env.ORDER_SERVICE_PORT || 5003}`;
app.use('/api/pedidos', httpProxy(orderServiceUrl, withRequestIdProxy({
    proxyReqPathResolver: (req) => {
        const suffix = req.url === '/' ? '' : req.url;
        return '/api/pedidos' + suffix;
    }
})));

app.use('/api/carrito', httpProxy(orderServiceUrl, withRequestIdProxy({
    proxyReqPathResolver: (req) => {
        const suffix = req.url === '/' ? '' : req.url;
        return '/api/carrito' + suffix;
    }
})));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'API Gateway is running', timestamp: new Date().toISOString() });
});

app.get('/health/deep', async (req, res) => {
    const checks = await Promise.all([
        checkDependency('auth-service', `${authServiceUrl}/health`, true),
        checkDependency('product-service', `${productServiceUrl}/api/health`, true),
        checkDependency('order-service', `${orderServiceUrl}/api/health`, true),
        checkDependency('strapi-cms', `${strapiUrl}/_health`, false)
    ]);

    const allUp = checks.every((item) => !item.required || item.status === 'up');

    res.status(allUp ? 200 : 503).json({
        status: allUp ? 'up' : 'degraded',
        timestamp: new Date().toISOString(),
        request_id: req.requestId,
        checks
    });
});

// Metrics básico
app.get('/metrics', (req, res) => {
    const snapshot = buildMetricsSnapshot();
    const wantsPrometheus = req.query.format === 'prometheus' || req.headers.accept?.includes('text/plain');

    if (wantsPrometheus) {
        res.type('text/plain').send(buildPrometheusMetrics(snapshot));
        return;
    }

    res.json(snapshot);
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: err.message 
    });
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 API Gateway corriendo en puerto ${PORT}`);
    console.log(`📡 Auth Service: ${authServiceUrl}`);
    console.log(`📡 Product Service: ${productServiceUrl}`);
    console.log(`📡 Order Service: ${orderServiceUrl}`);
});

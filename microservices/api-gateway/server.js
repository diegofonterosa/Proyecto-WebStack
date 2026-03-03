const express = require('express');
const cors = require('cors');
const httpProxy = require('express-http-proxy');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Verificar JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token && !req.path.includes('/auth')) {
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

// ============== RUTAS DE MICROSERVICIOS ==============

// AUTH SERVICE (Puerto 5001)
const authServiceUrl = `http://${process.env.AUTH_SERVICE_HOST || 'auth-service'}:${process.env.AUTH_SERVICE_PORT || 5001}`;
app.use('/api/auth', httpProxy(authServiceUrl, {
    proxyReqPathResolver: (req) => {
        return '/api' + req.url;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        return proxyResData;
    }
}));

// PRODUCT SERVICE (Puerto 5002)
const productServiceUrl = `http://${process.env.PRODUCT_SERVICE_HOST || 'product-service'}:${process.env.PRODUCT_SERVICE_PORT || 5002}`;
app.use('/api/productos', httpProxy(productServiceUrl, {
    proxyReqPathResolver: (req) => {
        return '/api' + req.url;
    }
}));

// STRAPI CMS (puede ser interno o URL pública)
const strapiUrl = process.env.STRAPI_URL || `http://${process.env.STRAPI_HOST || 'strapi-cms'}:${process.env.STRAPI_PORT || 1337}`;
app.use('/api/cms', httpProxy(strapiUrl, {
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        // reescribe path para que Strapi reciba /api en vez de /api/cms
        proxyReqOpts.path = srcReq.url.replace(/^\/api\/cms/, '/api');
        return proxyReqOpts;
    }
}));


// ORDER SERVICE (Puerto 5003)
const orderServiceUrl = `http://${process.env.ORDER_SERVICE_HOST || 'order-service'}:${process.env.ORDER_SERVICE_PORT || 5003}`;
app.use('/api/pedidos', httpProxy(orderServiceUrl, {
    proxyReqPathResolver: (req) => {
        return '/api' + req.url;
    }
}));

app.use('/api/carrito', httpProxy(orderServiceUrl, {
    proxyReqPathResolver: (req) => {
        return '/api' + req.url;
    }
}));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'API Gateway is running', timestamp: new Date().toISOString() });
});

// Metrics básico
app.get('/metrics', (req, res) => {
    res.json({
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    });
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

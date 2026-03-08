const express = require('express');
const cors = require('cors');
const httpProxy = require('express-http-proxy');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();

const viewsDir = process.env.EJS_VIEWS_DIR || path.resolve(__dirname, 'views');
const publicAssetsDir = process.env.PUBLIC_ASSETS_DIR || path.resolve(__dirname, 'public');

// URLs de microservicios
const authServiceUrl = `http://${process.env.AUTH_SERVICE_HOST || 'auth-service'}:${process.env.AUTH_SERVICE_PORT || 5001}`;
const productServiceUrl = `http://${process.env.PRODUCT_SERVICE_HOST || 'product-service'}:${process.env.PRODUCT_SERVICE_PORT || 5002}`;
const orderServiceUrl = `http://${process.env.ORDER_SERVICE_HOST || 'order-service'}:${process.env.ORDER_SERVICE_PORT || 5003}`;
const strapiUrl = process.env.STRAPI_URL || `http://${process.env.STRAPI_HOST || 'strapi-cms'}:${process.env.STRAPI_PORT || 1337}`;

app.use(cors());
app.use(express.json());
app.use(express.static(publicAssetsDir));
app.set('view engine', 'ejs');
app.set('views', viewsDir);

app.use((req, res, next) => {
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
	next();
});

const verifyToken = (req, res, next) => {
	const isPublicPath =
		req.path === '/' ||
		req.path === '/login' ||
		req.path === '/register' ||
		/^\/producto\/\d+$/.test(req.path) ||
		req.path === '/health' ||
		req.path === '/metrics' ||
		req.path.startsWith('/api/auth') ||
		req.path.startsWith('/api/productos') ||
		req.path.startsWith('/api/cms');

	if (isPublicPath) {
		return next();
	}

	const token = req.headers.authorization?.split(' ')[1];
	if (!token) {
		return res.status(401).json({ error: 'Token requerido' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
		req.usuario = decoded;
	} catch (error) {
		return res.status(401).json({ error: 'Token inválido' });
	}

	return next();
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

app.use('/api/auth', httpProxy(authServiceUrl, {
	proxyReqPathResolver: (req) => '/api' + req.url,
	userResDecorator: (proxyRes, proxyResData) => proxyResData
}));

app.use('/api/productos', httpProxy(productServiceUrl, {
	proxyReqPathResolver: (req) => '/api' + req.url
}));

app.use('/api/cms', httpProxy(strapiUrl, {
	proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
		proxyReqOpts.path = srcReq.url.replace(/^\/api\/cms/, '/api');
		return proxyReqOpts;
	}
}));

app.use('/api/pedidos', httpProxy(orderServiceUrl, {
	proxyReqPathResolver: (req) => '/api' + req.url
}));

app.use('/api/carrito', httpProxy(orderServiceUrl, {
	proxyReqPathResolver: (req) => '/api' + req.url
}));

app.get('/health', (req, res) => {
	res.json({ status: 'API Gateway is running', timestamp: new Date().toISOString() });
});

app.get('/metrics', (req, res) => {
	res.json({
		uptime: process.uptime(),
		memory: process.memoryUsage(),
		environment: process.env.NODE_ENV || 'development'
	});
});

app.use((err, req, res, next) => {
	console.error('Error:', err.message);
	res.status(500).json({
		error: 'Error interno del servidor',
		message: err.message
	});
});

app.use((req, res) => {
	res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`API Gateway corriendo en puerto ${PORT}`);
	console.log(`Auth Service: ${authServiceUrl}`);
	console.log(`Product Service: ${productServiceUrl}`);
	console.log(`Order Service: ${orderServiceUrl}`);
});

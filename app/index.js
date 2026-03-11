const express = require('express');
const cors = require('cors');
const httpProxy = require('express-http-proxy');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();

const viewsDir = process.env.EJS_VIEWS_DIR || path.resolve(__dirname, 'views');
const publicAssetsDir = process.env.PUBLIC_ASSETS_DIR || path.resolve(__dirname, 'public');
const stitchScreensDir = path.join(publicAssetsDir, 'stitch-screens');

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
		req.path === '/stitch' ||
		req.path.startsWith('/stitch/') ||
		req.path === '/storefront' ||
		req.path.startsWith('/storefront/') ||
		req.path === '/admin' ||
		req.path.startsWith('/admin/') ||
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

const stitchScreens = [
	{ slug: 'home', title: 'Milfshakes E-commerce Homepage', section: 'storefront' },
	{ slug: 'catalog', title: 'Milfshakes Product Catalog', section: 'storefront' },
	{ slug: 'cart', title: 'Milfshakes Shopping Cart View', section: 'storefront' },
	{ slug: 'checkout', title: 'Milfshakes Secure Checkout Page', section: 'storefront' },
	{ slug: 'ssl-dashboard', title: 'SSL Certificate Management Dashboard', section: 'admin' },
	{ slug: 'admin-dashboard', title: 'Milfshakes CMS Admin Dashboard Overview', section: 'admin' },
	{ slug: 'products-dashboard', title: 'CMS Product Management Dashboard', section: 'admin' },
	{ slug: 'product-editor', title: 'CMS Product Editor Interface', section: 'admin' },
	{ slug: 'add-product', title: 'CMS Add New Product Form', section: 'admin' },
	{ slug: 'product-variants', title: 'CMS Product Variant Management View', section: 'admin' },
	{ slug: 'media-library', title: 'CMS Media Library Manager', section: 'admin' },
	{ slug: 'orders-dashboard', title: 'Milfshakes CMS Order Management', section: 'admin' },
	{ slug: 'orders-view', title: 'Milfshakes CMS Order Management View', section: 'admin' },
	{ slug: 'customers-crm', title: 'Milfshakes CMS Customer CRM List', section: 'admin' },
	{ slug: 'low-stock-alerts', title: 'CMS Low Stock Alert Settings', section: 'admin' },
	{ slug: 'best-selling-report', title: 'CMS Best Selling Products Report', section: 'admin' },
	{ slug: 'global-settings', title: 'CMS Store Global Settings', section: 'admin' },
	{ slug: 'marketing-promotions', title: 'CMS Marketing & Promotions Manager', section: 'admin' },
	{ slug: 'roles-permissions', title: 'CMS User Roles & Permissions', section: 'admin' }
];

const stitchScreensBySlug = new Map(stitchScreens.map((screen) => [screen.slug, screen]));

const sendStitchHtml = (res, slug) => {
	res.sendFile(path.join(stitchScreensDir, `${slug}.html`));
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

app.get('/stitch', (req, res) => {
	const storefront = stitchScreens.filter((screen) => screen.section === 'storefront');
	const admin = stitchScreens.filter((screen) => screen.section === 'admin');

	res.render('stitch/index', {
		titulo: 'Stitch Screens',
		storefront,
		admin
	});
});

const renderStitchBySlug = (req, res, slug) => {
	const screen = stitchScreensBySlug.get(slug);

	if (!screen) {
		return res.status(404).render('stitch/screen', {
			titulo: 'Pantalla no encontrada',
			screen: null
		});
	}

	return res.render('stitch/screen', {
		titulo: screen.title,
		screen
	});
};

app.get('/stitch/:slug', (req, res) => {
	if (!stitchScreensBySlug.has(req.params.slug)) {
		return res.status(404).render('stitch/screen', {
			titulo: 'Pantalla no encontrada',
			screen: null
		});
	}

	return sendStitchHtml(res, req.params.slug);
});

app.get('/storefront', (req, res) => res.redirect('/storefront/home'));
app.get('/storefront/home', (req, res) => sendStitchHtml(res, 'home'));
app.get('/storefront/catalog', (req, res) => sendStitchHtml(res, 'catalog'));
app.get('/storefront/cart', (req, res) => sendStitchHtml(res, 'cart'));
app.get('/storefront/checkout', (req, res) => sendStitchHtml(res, 'checkout'));

app.get('/admin', (req, res) => res.redirect('/admin/dashboard'));
app.get('/admin/dashboard', (req, res) => sendStitchHtml(res, 'admin-dashboard'));
app.get('/admin/ssl', (req, res) => sendStitchHtml(res, 'ssl-dashboard'));
app.get('/admin/products', (req, res) => sendStitchHtml(res, 'products-dashboard'));
app.get('/admin/products/editor', (req, res) => sendStitchHtml(res, 'product-editor'));
app.get('/admin/products/new', (req, res) => sendStitchHtml(res, 'add-product'));
app.get('/admin/products/variants', (req, res) => sendStitchHtml(res, 'product-variants'));
app.get('/admin/media', (req, res) => sendStitchHtml(res, 'media-library'));
app.get('/admin/orders', (req, res) => sendStitchHtml(res, 'orders-dashboard'));
app.get('/admin/orders/table', (req, res) => sendStitchHtml(res, 'orders-view'));
app.get('/admin/customers', (req, res) => sendStitchHtml(res, 'customers-crm'));
app.get('/admin/inventory/alerts', (req, res) => sendStitchHtml(res, 'low-stock-alerts'));
app.get('/admin/reports/best-sellers', (req, res) => sendStitchHtml(res, 'best-selling-report'));
app.get('/admin/settings/store', (req, res) => sendStitchHtml(res, 'global-settings'));
app.get('/admin/marketing', (req, res) => sendStitchHtml(res, 'marketing-promotions'));
app.get('/admin/users/roles', (req, res) => sendStitchHtml(res, 'roles-permissions'));

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

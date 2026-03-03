import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// AUTENTICACIÓN
export const authAPI = {
  login: (email, contraseña) => API.post('/auth/login', { email, contraseña }),
  register: (nombre, email, contraseña) => API.post('/auth/register', { nombre, email, contraseña }),
  verify: () => API.get('/auth/verify')
}

// PRODUCTOS
export const productAPI = {
  getProductos: (page = 1, limit = 12) => API.get('/productos?page=' + page + '&limit=' + limit),
  getProducto: (id) => API.get(`/productos/${id}`),
  buscar: (q, categoria = '') => API.get(`/productos/search?q=${q}&categoria=${categoria}`),
  getCategorias: () => API.get('/categorias')
}

// CARRITO
export const cartAPI = {
  getCarrito: () => API.get('/carrito'),
  agregarProducto: (producto_id, cantidad) => API.post('/carrito/agregar', { producto_id, cantidad }),
  crearPedido: () => API.post('/pedidos/crear'),
  getPedidos: () => API.get('/pedidos')
}

export default API

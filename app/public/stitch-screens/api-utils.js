/**
 * API Utilities para Stitch Screens
 * Manejo de fetch, autenticación y manejo de errores
 */

const API_BASE_URL = '/api';

/**
 * Mostrar toast no bloqueante
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 */
function showToast(message, type = 'info') {
  const id = 'stitch-toast-container';
  let container = document.getElementById(id);

  if (!container) {
    container = document.createElement('div');
    container.id = id;
    container.style.position = 'fixed';
    container.style.top = '16px';
    container.style.right = '16px';
    container.style.zIndex = '10000';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const colors = {
    success: { bg: '#dcfce7', fg: '#166534', border: '#86efac' },
    error: { bg: '#fee2e2', fg: '#991b1b', border: '#fca5a5' },
    info: { bg: '#dbeafe', fg: '#1e40af', border: '#93c5fd' }
  };
  const c = colors[type] || colors.info;

  toast.textContent = message;
  toast.style.background = c.bg;
  toast.style.color = c.fg;
  toast.style.border = `1px solid ${c.border}`;
  toast.style.borderRadius = '10px';
  toast.style.padding = '10px 12px';
  toast.style.fontSize = '14px';
  toast.style.fontWeight = '600';
  toast.style.boxShadow = '0 8px 20px rgba(15,23,42,0.12)';

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
    if (container && container.children.length === 0) {
      container.remove();
    }
  }, 2600);
}

/**
 * Obtener token JWT del localStorage
 */
function getAuthToken() {
  const modernToken = localStorage.getItem('auth_token');
  const legacyToken = localStorage.getItem('token');

  if (modernToken) {
    return modernToken;
  }

  // Compatibilidad con vistas antiguas que guardan en `token`.
  if (legacyToken) {
    localStorage.setItem('auth_token', legacyToken);
    return legacyToken;
  }

  return null;
}

/**
 * Guardar token JWT en localStorage
 */
function setAuthToken(token) {
  if (token) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
  }
}

/**
 * Realizar request autenticado a la API
 * @param {string} endpoint - Ruta relativa (ej: /productos)
 * @param {object} options - Opciones fetch (method, body, etc)
 * @returns {Promise<object>} - Respuesta JSON
 */
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);

    // Si 401, limpiar token y redirigir a login
    if (response.status === 401) {
      if (token) {
        setAuthToken(null);
      }
      console.warn('Token expirado o inválido. Redirigiendo a login...');
      window.location.href = '/login';
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * GET - Listar productos con paginación
 * @param {number} page - Número de página
 * @param {number} limit - Productos por página (default 12)
 * @returns {Promise<{datos: array, pagination: object}>}
 */
async function getProductos(page = 1, limit = 12) {
  return apiCall(`/productos?page=${page}&limit=${limit}`);
}

/**
 * GET - Obtener detalle de un producto
 * @param {number} id - ID del producto
 * @returns {Promise<{datos: object}>}
 */
async function getProductoById(id) {
  return apiCall(`/productos/${id}`);
}

/**
 * GET - Buscar productos
 * @param {string} q - Término de búsqueda
 * @param {string} categoria - Filtro por categoría (opcional)
 * @returns {Promise<{datos: array}>}
 */
async function searchProductos(q, categoria = null) {
  let endpoint = `/productos/search?q=${encodeURIComponent(q)}`;
  if (categoria) {
    endpoint += `&categoria=${encodeURIComponent(categoria)}`;
  }
  return apiCall(endpoint);
}

/**
 * GET - Listar categorías
 * @returns {Promise<{datos: array}>}
 */
async function getCategorias() {
  return apiCall('/categorias');
}

/**
 * GET - Obtener carrito del usuario
 * @returns {Promise<{datos: array}>}
 */
async function getCarrito() {
  return apiCall('/carrito');
}

/**
 * POST - Agregar producto al carrito
 * @param {number} productoId - ID del producto
 * @param {number} cantidad - Cantidad a agregar
 * @returns {Promise<{datos: object}>}
 */
async function agregarAlCarrito(productoId, cantidad = 1) {
  return apiCall('/carrito/agregar', {
    method: 'POST',
    body: JSON.stringify({ producto_id: productoId, cantidad })
  });
}

/**
 * POST - Crear un pedido
 * @param {array} items - Items del pedido
 * @returns {Promise<{datos: object}>}
 */
async function crearPedido(items) {
  return apiCall('/pedidos/crear', {
    method: 'POST',
    body: JSON.stringify({ items })
  });
}

/**
 * Renderizar tabla de productos en HTML
 * @param {array} productos - Array de productos
 * @param {string} containerId - ID del contenedor
 * @param {boolean} isAdmin - Si es vista admin (mostrar acciones)
 */
function renderProductosTable(productos, containerId, isAdmin = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!productos || productos.length === 0) {
    container.innerHTML = '<p class="text-gray-500 p-4">No hay productos disponibles</p>';
    return;
  }

  let html = `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-100 border-b">
          <tr>
            <th class="px-4 py-2 text-left">Producto</th>
            <th class="px-4 py-2 text-right">Precio</th>
            <th class="px-4 py-2 text-right">Stock</th>
            <th class="px-4 py-2 text-left">Categoría</th>
            ${isAdmin ? '<th class="px-4 py-2 text-center">Acciones</th>' : ''}
          </tr>
        </thead>
        <tbody>
  `;

  productos.forEach(prod => {
    html += `
      <tr class="border-b hover:bg-gray-50">
        <td class="px-4 py-2 font-medium">${escapeHtml(prod.nombre)}</td>
        <td class="px-4 py-2 text-right">$${parseFloat(prod.precio).toFixed(2)}</td>
        <td class="px-4 py-2 text-right">${prod.stock}</td>
        <td class="px-4 py-2">${escapeHtml(prod.categoria || '-')}</td>
        ${isAdmin ? `
          <td class="px-4 py-2 text-center">
            <a href="/admin/products/editor?id=${prod.id}" class="text-blue-600 hover:underline mr-2">Editar</a>
            <button onclick="deleteProducto(${prod.id})" class="text-red-600 hover:underline">Eliminar</button>
          </td>
        ` : ''}
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}

/**
 * Renderizar grid de productos en HTML
 * @param {array} productos - Array de productos
 * @param {string} containerId - ID del contenedor
 */
function renderProductosGrid(productos, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!productos || productos.length === 0) {
    container.innerHTML = '<p class="text-center text-gray-500 py-8">No hay productos disponibles</p>';
    return;
  }

  let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">';

  productos.forEach(prod => {
    html += `
      <div class="bg-white rounded-lg shadow-sm hover:shadow-md transition p-4">
        <div class="bg-gray-200 h-48 rounded mb-3 flex items-center justify-center overflow-hidden">
          <img 
            src="${escapeHtml(prod.imagen_url || '/images/placeholder.svg')}" 
            alt="${escapeHtml(prod.nombre)}"
            class="w-full h-full object-cover"
            onerror="this.src='/images/placeholder.svg'"
          />
        </div>
        <h3 class="font-bold text-sm line-clamp-2">${escapeHtml(prod.nombre)}</h3>
        <p class="text-gray-600 text-xs mb-2 line-clamp-2">${escapeHtml(prod.descripcion || '')}</p>
        <div class="flex justify-between items-center">
          <span class="text-lg font-bold">$${parseFloat(prod.precio).toFixed(2)}</span>
          <button 
            onclick="agregarAlCarritoUI(${prod.id})"
            class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
          >
            Agregar
          </button>
        </div>
        <p class="text-gray-500 text-xs mt-2">Stock: ${prod.stock}</p>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

/**
 * Utilidad: Escapar HTML para evitar XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
}

/**
 * Handler: Agregar al carrito desde UI
 */
async function agregarAlCarritoUI(productoId) {
  try {
    const result = await agregarAlCarrito(productoId, 1);
    showToast('Producto agregado al carrito', 'success');
  } catch (error) {
    showToast('Error al agregar al carrito: ' + (error.message || 'Error desconocido'), 'error');
  }
}

/**
 * Handler: Eliminar producto (admin solo)
 */
async function deleteProducto(productoId) {
  if (!confirm('¿Seguro que quieres eliminar este producto?')) {
    return;
  }
  try {
    const result = await apiCall(`/productos/${productoId}`, { method: 'DELETE' });
    showToast('Producto eliminado', 'success');
    location.reload(); // Recargar página
  } catch (error) {
    showToast('Error al eliminar: ' + (error.message || 'Error desconocido'), 'error');
  }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    apiCall,
    getProductos,
    getProductoById,
    searchProductos,
    getCategorias,
    getCarrito,
    agregarAlCarrito,
    crearPedido,
    renderProductosTable,
    renderProductosGrid,
    getAuthToken,
    setAuthToken
  };
}

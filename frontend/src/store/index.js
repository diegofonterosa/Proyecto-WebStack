import { create } from 'zustand'

// Store de autenticación
export const useAuthStore = create((set) => ({
  usuario: null,
  token: localStorage.getItem('token'),
  
  login: (usuario, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('usuario', JSON.stringify(usuario))
    set({ usuario, token })
  },
  
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    set({ usuario: null, token: null })
  },
  
  cargarDesdeStorage: () => {
    const token = localStorage.getItem('token')
    const usuario = localStorage.getItem('usuario')
    if (token && usuario) {
      set({ token, usuario: JSON.parse(usuario) })
    }
  }
}))

// Store del carrito
export const useCartStore = create((set) => ({
  items: [],
  total: 0,
  
  agregarProducto: (producto, cantidad) => {
    set((state) => {
      const existe = state.items.find(item => item.producto_id === producto.id)
      let nuevoCarrito
      
      if (existe) {
        nuevoCarrito = state.items.map(item =>
          item.producto_id === producto.id
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        )
      } else {
        nuevoCarrito = [...state.items, { ...producto, producto_id: producto.id, cantidad }]
      }
      
      const nuevoTotal = nuevoCarrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
      return { items: nuevoCarrito, total: nuevoTotal }
    })
  },
  
  eliminarProducto: (productoId) => {
    set((state) => {
      const nuevoCarrito = state.items.filter(item => item.producto_id !== productoId)
      const nuevoTotal = nuevoCarrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
      return { items: nuevoCarrito, total: nuevoTotal }
    })
  },
  
  actualizarCantidad: (productoId, cantidad) => {
    set((state) => {
      const nuevoCarrito = state.items.map(item =>
        item.producto_id === productoId
          ? { ...item, cantidad }
          : item
      ).filter(item => item.cantidad > 0)
      
      const nuevoTotal = nuevoCarrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
      return { items: nuevoCarrito, total: nuevoTotal }
    })
  },
  
  vaciarCarrito: () => {
    set({ items: [], total: 0 })
  }
}))

// Store de productos
export const useProductStore = create((set) => ({
  productos: [],
  filtro: {
    pagina: 1,
    busqueda: '',
    categoria: ''
  },
  
  setFiltro: (filtro) => set((state) => ({ filtro: { ...state.filtro, ...filtro } })),
  setProductos: (productos) => set({ productos })
}))

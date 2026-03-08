import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { productAPI, cartAPI } from '../api/client'
import { useCartStore, useAuthStore } from '../store'
import '../styles/Producto.css'

export default function Producto() {
  const { id } = useParams()
  const [producto, setProducto] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [cargando, setCargando] = useState(true)
  const { usuario } = useAuthStore()
  const { agregarProducto } = useCartStore()

  useEffect(() => {
    productAPI.getProducto(id).then(res => {
      setProducto(res.data.datos)
      setCargando(false)
    }).catch(err => {
      console.error('Error:', err)
      setCargando(false)
    })
  }, [id])

  const handleAgregarCarrito = async () => {
    if (!usuario) {
      alert('Debes iniciar sesión')
      return
    }

    try {
      await cartAPI.agregarProducto(producto.id, cantidad)
      agregarProducto(producto, cantidad)
      alert('Producto agregado al carrito')
    } catch (error) {
      alert('Error al agregar al carrito')
    }
  }

  if (cargando) return <div className="loading">Cargando...</div>
  if (!producto) return <div className="error">Producto no encontrado</div>

  return (
    <main className="producto-detail">
      <div className="producto-container">
        <div className="imagen">
          <img src={producto.imagen_url} alt={producto.nombre} />
        </div>

        <div className="info">
          <h1>{producto.nombre}</h1>
          <p className="categoria">{producto.categoria}</p>
          <p className="descripcion">{producto.descripcion}</p>

          <div className="precio-section">
            <h2 className="precio">${producto.precio}</h2>
            <p className="stock">
              Stock: <strong>{producto.stock > 0 ? producto.stock : 'Agotado'}</strong>
            </p>
          </div>

          {producto.stock > 0 && (
            <div className="compra">
              <div className="cantidad">
                <label>Cantidad:</label>
                <input
                  type="number"
                  min="1"
                  max={producto.stock}
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value))}
                />
              </div>
              <button
                onClick={handleAgregarCarrito}
                className="btn-agregar"
              >
                🛒 Agregar al Carrito
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
